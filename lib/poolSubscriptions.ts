import { addDays, addMonths, addWeeks } from "date-fns";
import type { PoolSubscriptionInterval } from "@/lib/api";

/**
 * Pool subscription schedule helpers (#544).
 *
 * The preview on the Subscribe tab and the active subscription card both use
 * these, so the next-execution date and annual projection have one definition.
 */

export const POOL_SUBSCRIPTION_INTERVALS: readonly PoolSubscriptionInterval[] = [
  "daily",
  "weekly",
  "monthly",
];

export const POOL_SUBSCRIPTION_INTERVAL_LABELS: Record<PoolSubscriptionInterval, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const EXECUTIONS_PER_YEAR: Record<PoolSubscriptionInterval, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
};

/** The first execution after `from`, one interval later. */
export function nextExecutionDate(interval: PoolSubscriptionInterval, from: Date): Date {
  switch (interval) {
    case "daily":
      return addDays(from, 1);
    case "weekly":
      return addWeeks(from, 1);
    case "monthly":
      return addMonths(from, 1);
  }
}

/** Amount invested over a full year at this cadence, in XLM. */
export function projectedAnnualInvestment(
  amount: number,
  interval: PoolSubscriptionInterval,
): number {
  return amount * EXECUTIONS_PER_YEAR[interval];
}

export interface SubscriptionAmountResult {
  valid: boolean;
  error?: string;
  amount: number | null;
}

/** Validates the per-execution amount typed into the form. */
export function validateSubscriptionAmount(raw: string): SubscriptionAmountResult {
  const amount = raw.trim() === "" ? Number.NaN : Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, error: "Enter an amount greater than 0.", amount: null };
  }
  return { valid: true, amount };
}
