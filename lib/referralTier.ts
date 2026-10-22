import type { ReferralTierDefinition, ReferralTierName, ReferralTierStatus } from "@/lib/api";

export const REFERRAL_TIER_LABELS: Record<ReferralTierName, string> = {
  standard: "Standard",
  plus: "Plus",
  elite: "Elite",
};

/** The top tier — no further progress is tracked past it. */
export const MAX_REFERRAL_TIER: ReferralTierName = "elite";

export interface ReferralTierProgress {
  /** The tier above the current one, or null at the top tier. */
  nextTier: ReferralTierDefinition | null;
  /** 0-100. 100 once the top tier is reached. */
  percent: number;
  /** Referred volume still needed to reach the next tier. */
  remaining: number;
}

/**
 * Progress from the current referral tier toward the next one, measured
 * against the cumulative referred volume.
 */
export function getReferralTierProgress(status: ReferralTierStatus): ReferralTierProgress {
  const ordered = [...status.tiers].sort((a, b) => a.threshold - b.threshold);
  const currentIndex = ordered.findIndex((t) => t.tier === status.tier);
  const current = currentIndex >= 0 ? ordered[currentIndex] : undefined;
  const nextTier = currentIndex >= 0 ? ordered[currentIndex + 1] ?? null : null;

  if (!nextTier) return { nextTier: null, percent: 100, remaining: 0 };

  const floor = current?.threshold ?? 0;
  const span = nextTier.threshold - floor;
  const done = status.cumulative_referred_volume - floor;
  const percent = span > 0 ? Math.min(100, Math.max(0, (done / span) * 100)) : 100;

  return {
    nextTier,
    percent,
    remaining: Math.max(0, nextTier.threshold - status.cumulative_referred_volume),
  };
}

/** The commission rate unlocked at the given tier. */
export function getReferralCommissionRate(
  status: ReferralTierStatus,
): number {
  const current = status.tiers.find((t) => t.tier === status.tier);
  return current?.commission_rate ?? 0;
}

/** True when the wallet has reached the top referral tier. */
export function isMaxReferralTier(tier: ReferralTierName): boolean {
  return tier === MAX_REFERRAL_TIER;
}
