/**
 * Maturity enforcement (issue #498).
 *
 * After an invoice's maturity date the contract gives the issuer a grace
 * period, then accrues a daily late penalty, and finally marks the invoice
 * defaulted. These helpers mirror those rules for display; an API-supplied
 * penalty always wins over the computed estimate.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const GRACE_PERIOD_DAYS = 7;
/** Days overdue at which the default countdown becomes visible. */
export const DEFAULT_WARNING_DAYS = 15;
/** Days overdue at which the contract marks the invoice defaulted. */
export const DEFAULT_AFTER_DAYS = 30;
/** Late penalty per day past the grace period, in basis points of face value. */
export const PENALTY_BPS_PER_DAY = 10;

export type MaturityPhase = "upcoming" | "grace" | "penalty" | "default_risk" | "defaulted";

export interface MaturityState {
  phase: MaturityPhase;
  daysOverdue: number;
  /** Whole days left in the grace period; 0 once it has ended. */
  graceDaysRemaining: number;
  /** Days overdue past the grace period that accrue a penalty. */
  penaltyDays: number;
  /** Whole days until default; null before the warning threshold. */
  daysUntilDefault: number | null;
}

export function daysOverdue(maturityDate: string, now: number = Date.now()): number {
  const t = new Date(maturityDate).getTime();
  if (Number.isNaN(t) || now <= t) return 0;
  return Math.ceil((now - t) / MS_PER_DAY);
}

export function getMaturityState(maturityDate: string, now: number = Date.now()): MaturityState {
  const overdue = daysOverdue(maturityDate, now);
  const penaltyDays = Math.max(0, overdue - GRACE_PERIOD_DAYS);
  const graceDaysRemaining = Math.max(0, GRACE_PERIOD_DAYS - overdue);

  let phase: MaturityPhase = "upcoming";
  if (overdue >= DEFAULT_AFTER_DAYS) phase = "defaulted";
  else if (overdue >= DEFAULT_WARNING_DAYS) phase = "default_risk";
  else if (overdue > GRACE_PERIOD_DAYS) phase = "penalty";
  else if (overdue > 0) phase = "grace";

  return {
    phase,
    daysOverdue: overdue,
    graceDaysRemaining,
    penaltyDays,
    daysUntilDefault:
      overdue >= DEFAULT_WARNING_DAYS ? Math.max(0, DEFAULT_AFTER_DAYS - overdue) : null,
  };
}

export function computeLatePenalty(faceValue: number, penaltyDays: number): number {
  if (!Number.isFinite(faceValue) || faceValue <= 0 || penaltyDays <= 0) return 0;
  return (faceValue * PENALTY_BPS_PER_DAY * penaltyDays) / 10_000;
}

export const MATURITY_PHASE_LABELS: Record<MaturityPhase, string> = {
  upcoming: "On schedule",
  grace: "Grace period",
  penalty: "Late - penalty accruing",
  default_risk: "At risk of default",
  defaulted: "Defaulted",
};

export type InvoiceEventType = "MaturityMissed" | "PenaltyAccrued" | "Funded" | "Settled";

export interface InvoiceEvent {
  id: string;
  type: InvoiceEventType;
  timestamp: string;
  amount?: number | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export async function fetchInvoiceEvents(
  invoiceId: string,
  signal?: AbortSignal
): Promise<InvoiceEvent[]> {
  const res = await fetch(`${API_BASE}/invoices/${encodeURIComponent(invoiceId)}/events`, {
    signal,
  });
  if (!res.ok) throw new Error("Failed to fetch invoice events");
  const data = (await res.json()) as { events?: InvoiceEvent[] } | InvoiceEvent[];
  return Array.isArray(data) ? data : (data.events ?? []);
}
