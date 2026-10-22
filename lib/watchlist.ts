import type { Invoice, WatchlistRegistryEntry } from "@/lib/api";

// Re-exported so consumers can pull the watchlist domain types from one place.
export type { WatchlistRegistryEntry };

/**
 * Domain logic for the investor watchlist (#474).
 *
 * The watchlist is a set of invoices an investor is monitoring. Beyond simply
 * listing them, the page surfaces *state changes* — an invoice that just got
 * funded, one that just matured, one that just settled — so a watched invoice
 * that changes while the investor is away announces itself when they return.
 *
 * This module is deliberately free of React and network concerns so the
 * "is this a recent state change?" rule can be unit-tested in isolation and
 * reused by both the hook and the card.
 */

export type InvoiceStatus = Invoice["status"];

export type WatchlistStateChangeKind =
  | "now_funded"
  | "matured"
  | "settled"
  | "now_open";

export interface WatchlistStateChange {
  kind: WatchlistStateChangeKind;
  /** Short label shown inside the badge, e.g. "Now Funded". */
  label: string;
  /** Sentence used for the accessible title / tooltip. */
  description: string;
  /** ISO timestamp of the transition, when one is known. */
  changedAt: string | null;
}

/** How long after a transition a badge is still considered "recent". */
export const STATE_CHANGE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const CHANGES_BY_STATUS: Partial<
  Record<InvoiceStatus, Omit<WatchlistStateChange, "changedAt">>
> = {
  open: {
    kind: "now_open",
    label: "Now Open",
    description: "This invoice is now open for investment.",
  },
  funded: {
    kind: "now_funded",
    label: "Now Funded",
    description: "This invoice reached its funding target.",
  },
  settled: {
    kind: "settled",
    label: "Settled",
    description: "This invoice settled and investor payouts are available.",
  },
};

const MATURED_CHANGE: Omit<WatchlistStateChange, "changedAt"> = {
  kind: "matured",
  label: "Matured",
  description: "This invoice passed its maturity date and is awaiting settlement.",
};

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/** True when `iso` falls inside the trailing `windowMs` ending at `now`. */
function isRecent(
  iso: string | null | undefined,
  nowMs: number,
  windowMs: number,
): boolean {
  const time = parseTime(iso);
  if (time === null) return false;
  // A timestamp slightly in the future (clock skew) still counts as recent.
  return time <= nowMs + 60_000 && nowMs - time <= windowMs;
}

function changeForStatus(
  status: InvoiceStatus,
  changedAt: string | null,
): WatchlistStateChange | null {
  const base = CHANGES_BY_STATUS[status];
  return base ? { ...base, changedAt } : null;
}

export interface DetectStateChangeOptions {
  /** Reference time; defaults to now. */
  now?: Date;
  /** Override the recency window (tests, or a shorter "new" period). */
  windowMs?: number;
  /** Status the registry recorded when the invoice was last acknowledged. */
  previousStatus?: InvoiceStatus | null;
  /** When the registry observed the transition, if it recorded one. */
  changedAt?: string | null;
}

/**
 * Resolves the state-change badge for a watched invoice, or `null` when
 * nothing noteworthy changed recently.
 *
 * Precedence:
 *   1. an explicit registry transition inside the recency window,
 *   2. the invoice's own `settled_at` / `funded_at` timestamps,
 *   3. a maturity date that has just passed (only while unsettled).
 *
 * Every branch tolerates missing fields, so an older backend response produces
 * no badge rather than a crash or a misleading one.
 */
export function detectStateChange(
  invoice: Pick<
    Invoice,
    "status" | "funded_at" | "settled_at" | "due_date" | "maturity_date"
  >,
  options: DetectStateChangeOptions = {},
): WatchlistStateChange | null {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();
  const windowMs = options.windowMs ?? STATE_CHANGE_WINDOW_MS;
  const previousStatus = options.previousStatus ?? null;
  const registryChangeAt = options.changedAt ?? null;

  // 1. The registry saw an actual transition and can tell us when.
  if (
    previousStatus &&
    previousStatus !== invoice.status &&
    isRecent(registryChangeAt, nowMs, windowMs)
  ) {
    const change = changeForStatus(invoice.status, registryChangeAt);
    if (change) return change;
  }

  // 2. The invoice carries its own transition timestamps.
  if (invoice.status === "settled" && isRecent(invoice.settled_at, nowMs, windowMs)) {
    return changeForStatus("settled", invoice.settled_at ?? null);
  }
  if (invoice.status === "funded" && isRecent(invoice.funded_at, nowMs, windowMs)) {
    return changeForStatus("funded", invoice.funded_at ?? null);
  }

  // 3. "Matured" is derived: there is no `matured` status, only a funded
  //    invoice whose maturity date has just passed while it awaits settlement.
  if (invoice.status === "funded") {
    const maturity = invoice.maturity_date || invoice.due_date;
    const maturityTime = parseTime(maturity);
    if (
      maturityTime !== null &&
      maturityTime <= nowMs &&
      nowMs - maturityTime <= windowMs
    ) {
      return { ...MATURED_CHANGE, changedAt: maturity ?? null };
    }
  }

  return null;
}
