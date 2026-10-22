/**
 * Partial-settlement repayment timeline (#478).
 *
 * A funded invoice can be repaid in several instalments before the settlement
 * that closes it. This module turns the raw `get_interim_payments` rows into an
 * ordered ledger with a running cumulative total and remaining balance, which
 * is what the detail-page timeline renders.
 *
 * Pure and framework-free so the cumulative maths (ordering, overpayment
 * clamping, the final "Settled" entry) can be unit-tested in isolation.
 */

export interface InterimPaymentInput {
  id: string;
  amount: number;
  /** ISO 8601 timestamp of the payment. */
  paid_at: string;
  tx_hash?: string | null;
  /** Contract flag on the payment that closes the invoice. */
  is_final?: boolean | null;
}

export interface SettlementTimelineEntry {
  id: string;
  amount: number;
  paidAt: string;
  /** Sum of this payment and every earlier one. */
  cumulativePaid: number;
  /** Face value still outstanding after this payment (never negative). */
  remaining: number;
  /** True for the settlement that closes the invoice. */
  isFinal: boolean;
  txHash?: string | null;
}

export interface SettlementTimelineSummary {
  entries: SettlementTimelineEntry[];
  /** Face value the issuer owes in total. */
  totalDue: number;
  totalPaid: number;
  remaining: number;
  /** Repayment progress, 0-100. `0` when the amount due is unknown/zero. */
  repaidPercent: number;
  isFullyRepaid: boolean;
}

export interface BuildSettlementTimelineOptions {
  /** Total amount the issuer is expected to repay. */
  totalDue?: number | null;
  /** Invoice status is `settled`; used to badge the final entry when the
   * contract response does not flag one. */
  isSettled?: boolean;
}

function normaliseAmount(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

function paymentTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Orders the payments oldest-first and annotates each with its cumulative
 * total and remaining balance. The last payment is marked final when the
 * contract says so, or when the invoice is settled.
 */
export function buildSettlementTimeline(
  payments: readonly InterimPaymentInput[],
  options: BuildSettlementTimelineOptions = {},
): SettlementTimelineSummary {
  const totalDue = normaliseAmount(options.totalDue);

  // Stable sort by payment time; entries with a missing/invalid date keep
  // their relative order at the start rather than being dropped.
  const ordered = payments
    .map((payment, index) => ({ payment, index }))
    .sort((a, b) => {
      const delta =
        paymentTime(a.payment.paid_at) - paymentTime(b.payment.paid_at);
      return delta !== 0 ? delta : a.index - b.index;
    })
    .map(({ payment }) => payment);

  let cumulative = 0;
  const entries: SettlementTimelineEntry[] = ordered.map((payment, index) => {
    const amount = normaliseAmount(payment.amount);
    cumulative += amount;
    const isLast = index === ordered.length - 1;
    const isFinal =
      payment.is_final === true ||
      (options.isSettled === true && isLast) ||
      // No status/flag available, but the balance is cleared: treat the last
      // payment that reaches the total as the settlement.
      (isLast && totalDue > 0 && cumulative >= totalDue);

    return {
      id: payment.id,
      amount,
      paidAt: payment.paid_at,
      cumulativePaid: cumulative,
      remaining: totalDue > 0 ? Math.max(0, totalDue - cumulative) : 0,
      isFinal,
      txHash: payment.tx_hash ?? null,
    };
  });

  const totalPaid = cumulative;
  const isFullyRepaid = totalDue > 0 && totalPaid >= totalDue;
  const repaidPercent =
    totalDue > 0 ? clampPercent((totalPaid / totalDue) * 100) : 0;

  return {
    entries,
    totalDue,
    totalPaid,
    remaining: totalDue > 0 ? Math.max(0, totalDue - totalPaid) : 0,
    repaidPercent,
    isFullyRepaid,
  };
}

/** `12,500 XLM`, dropping trailing `.00`. */
export function formatPaymentAmount(amount: number): string {
  return `${normaliseAmount(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} XLM`;
}

/** e.g. "Mar 4, 2026, 2:30 PM". Invalid dates fall back to an em dash. */
export function formatPaymentDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
