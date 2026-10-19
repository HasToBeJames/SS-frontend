import type { Syndicate } from "@/lib/api";

/** Validation error for a co-investment amount, or null when it is valid. */
export function validateCoInvestAmount(amount: number, minCoInvest: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than 0.";
  if (amount < minCoInvest) {
    return `Amount is below the minimum co-investment of ${minCoInvest.toLocaleString()} XLM.`;
  }
  return null;
}

export function syndicateGap(syndicate: Pick<Syndicate, "target" | "committed">): number {
  return Math.max(0, syndicate.target - syndicate.committed);
}

export function isTargetMet(syndicate: Pick<Syndicate, "target" | "committed">): boolean {
  return syndicate.committed >= syndicate.target;
}
