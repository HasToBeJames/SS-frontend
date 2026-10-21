import { subDays } from "date-fns";
import type { AlertPreferences, UpcomingMaturity } from "@/lib/api";

export type AlertEventType = keyof AlertPreferences;

export const ALERT_EVENTS: {
  key: AlertEventType;
  label: string;
  description: string;
}[] = [
  { key: "settlement", label: "Settlement", description: "An invoice you hold is settled." },
  { key: "kyc_expiry", label: "KYC Expiry", description: "Your KYC verification is about to expire." },
  { key: "watchlist_change", label: "Watchlist Change", description: "A watched invoice changes state." },
  { key: "auto_invest", label: "Auto-Invest", description: "Auto-invest buys an invoice on your behalf." },
  { key: "maturity_approaching", label: "Maturity Approaching", description: "An invoice you hold is nearing maturity." },
];

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  settlement: true,
  kyc_expiry: true,
  watchlist_change: true,
  auto_invest: true,
  maturity_approaching: true,
};

/** Fills missing or non-boolean keys with the all-enabled default. */
export function normalizeAlertPreferences(
  raw: Partial<AlertPreferences> | null | undefined,
): AlertPreferences {
  const result = { ...DEFAULT_ALERT_PREFERENCES };
  if (!raw) return result;
  for (const { key } of ALERT_EVENTS) {
    if (typeof raw[key] === "boolean") result[key] = raw[key] as boolean;
  }
  return result;
}

/* ─── Maturity reminders (#542) ──────────────────────────────────────────── */

/** Days before an invoice's maturity date at which a reminder can fire. */
export const MATURITY_REMINDER_INTERVALS = [30, 14, 7, 1] as const;

export type MaturityReminderInterval = (typeof MATURITY_REMINDER_INTERVALS)[number];

export const DEFAULT_MATURITY_REMINDER_DAYS: MaturityReminderInterval[] = [
  ...MATURITY_REMINDER_INTERVALS,
];

/** Keeps only known intervals, ordered longest lead time first. */
export function normalizeMaturityReminderDays(raw: unknown): MaturityReminderInterval[] {
  if (!Array.isArray(raw)) return [...DEFAULT_MATURITY_REMINDER_DAYS];
  return MATURITY_REMINDER_INTERVALS.filter((days) => raw.includes(days));
}

/** Adds the interval when absent and removes it when present, keeping the canonical order. */
export function toggleMaturityReminderDay(
  current: readonly MaturityReminderInterval[],
  days: MaturityReminderInterval,
): MaturityReminderInterval[] {
  const next = current.includes(days)
    ? current.filter((value) => value !== days)
    : [...current, days];
  return MATURITY_REMINDER_INTERVALS.filter((value) => next.includes(value));
}

export interface MaturityReminderSchedule {
  days: MaturityReminderInterval;
  fireAt: Date;
}

export interface MaturityReminderPreview {
  invoiceId: string;
  title: string;
  dueDate: string;
  amount: number;
  daysRemaining: number;
  /** Enabled reminders that have not fired yet, soonest first. */
  upcoming: MaturityReminderSchedule[];
}

function timeOf(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

/**
 * Builds the preview for the Maturity Reminders section: each holding sorted by
 * nearest maturity, with the enabled reminder dates still ahead of `now`.
 */
export function buildMaturityReminderPreview(
  maturities: readonly UpcomingMaturity[],
  days: readonly MaturityReminderInterval[],
  now: Date = new Date(),
): MaturityReminderPreview[] {
  return [...maturities]
    .sort((a, b) => timeOf(a.due_date) - timeOf(b.due_date))
    .map((maturity) => {
      const due = new Date(maturity.due_date);
      const upcoming = Number.isNaN(due.getTime())
        ? []
        : days
            .map((interval) => ({ days: interval, fireAt: subDays(due, interval) }))
            .filter((schedule) => schedule.fireAt.getTime() > now.getTime())
            .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());

      return {
        invoiceId: maturity.invoice_id,
        title: maturity.title,
        dueDate: maturity.due_date,
        amount: maturity.amount,
        daysRemaining: maturity.days_remaining,
        upcoming,
      };
    });
}
