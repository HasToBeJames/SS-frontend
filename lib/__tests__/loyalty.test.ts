import { describe, it, expect } from "vitest";
import { getLoyaltyProgress, isRecentlyPromoted, TIER_UPGRADE_BANNER_MS } from "../loyalty";
import type { InvestorLoyalty } from "../api";

const tiers: InvestorLoyalty["tiers"] = [
  { tier: "bronze", threshold: 0, fee_discount: 0, yield_boost: 0 },
  { tier: "silver", threshold: 10000, fee_discount: 5, yield_boost: 0.25 },
  { tier: "gold", threshold: 50000, fee_discount: 10, yield_boost: 0.5 },
  { tier: "platinum", threshold: 200000, fee_discount: 20, yield_boost: 1 },
];

describe("getLoyaltyProgress", () => {
  it("measures progress from the current tier threshold to the next", () => {
    const progress = getLoyaltyProgress({ tier: "silver", cumulative_volume: 30000, tiers });
    expect(progress.nextTier?.tier).toBe("gold");
    expect(progress.percent).toBe(50);
    expect(progress.remaining).toBe(20000);
  });

  it("reports full progress and no next tier at platinum", () => {
    const progress = getLoyaltyProgress({ tier: "platinum", cumulative_volume: 250000, tiers });
    expect(progress.nextTier).toBeNull();
    expect(progress.percent).toBe(100);
  });
});

describe("isRecentlyPromoted", () => {
  const now = new Date("2026-01-10T12:00:00Z").getTime();

  it("is true inside the 48h window", () => {
    expect(
      isRecentlyPromoted(new Date(now - TIER_UPGRADE_BANNER_MS + 1000).toISOString(), now),
    ).toBe(true);
  });

  it("is false after 48h", () => {
    expect(
      isRecentlyPromoted(new Date(now - TIER_UPGRADE_BANNER_MS - 1000).toISOString(), now),
    ).toBe(false);
  });

  it("is false with no promotion", () => {
    expect(isRecentlyPromoted(null, now)).toBe(false);
  });
});
