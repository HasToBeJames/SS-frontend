import type { InvestorLoyalty, LoyaltyTierDefinition, LoyaltyTierName } from "@/lib/api";

export const LOYALTY_TIER_LABELS: Record<LoyaltyTierName, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

/** How long the promotion banner stays up after a tier upgrade. */
export const TIER_UPGRADE_BANNER_MS = 48 * 60 * 60 * 1000;

export interface LoyaltyProgress {
  nextTier: LoyaltyTierDefinition | null;
  /** 0-100. 100 once the top tier is reached. */
  percent: number;
  remaining: number;
}

export function getLoyaltyProgress(loyalty: InvestorLoyalty): LoyaltyProgress {
  const ordered = [...loyalty.tiers].sort((a, b) => a.threshold - b.threshold);
  const currentIndex = ordered.findIndex((t) => t.tier === loyalty.tier);
  const current = ordered[currentIndex];
  const nextTier = currentIndex >= 0 ? ordered[currentIndex + 1] ?? null : null;

  if (!nextTier) return { nextTier: null, percent: 100, remaining: 0 };

  const floor = current?.threshold ?? 0;
  const span = nextTier.threshold - floor;
  const done = loyalty.cumulative_volume - floor;
  const percent = span > 0 ? Math.min(100, Math.max(0, (done / span) * 100)) : 100;
  return {
    nextTier,
    percent,
    remaining: Math.max(0, nextTier.threshold - loyalty.cumulative_volume),
  };
}

export function isRecentlyPromoted(
  promotedAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!promotedAt) return false;
  const promoted = new Date(promotedAt).getTime();
  if (Number.isNaN(promoted)) return false;
  const age = now - promoted;
  return age >= 0 && age < TIER_UPGRADE_BANNER_MS;
}
