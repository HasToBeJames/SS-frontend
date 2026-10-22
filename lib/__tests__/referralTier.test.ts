import { describe, it, expect } from "vitest";
import {
  REFERRAL_TIER_LABELS,
  getReferralCommissionRate,
  getReferralTierProgress,
  isMaxReferralTier,
} from "@/lib/referralTier";
import type { ReferralTierStatus } from "@/lib/api";

const tiers: ReferralTierStatus["tiers"] = [
  { tier: "standard", threshold: 0, commission_rate: 2 },
  { tier: "plus", threshold: 10000, commission_rate: 4 },
  { tier: "elite", threshold: 50000, commission_rate: 6 },
];

function status(overrides: Partial<ReferralTierStatus> = {}): ReferralTierStatus {
  return {
    tier: "standard",
    cumulative_referred_volume: 0,
    tiers,
    ...overrides,
  };
}

describe("getReferralTierProgress", () => {
  it("reports the next tier and the volume still needed", () => {
    const progress = getReferralTierProgress(
      status({ tier: "plus", cumulative_referred_volume: 4000 }),
    );
    expect(progress.nextTier?.tier).toBe("elite");
    expect(progress.remaining).toBe(46000);
  });

  it("computes progress within the current tier band", () => {
    const progress = getReferralTierProgress(
      status({ tier: "plus", cumulative_referred_volume: 30000 }),
    );
    expect(progress.percent).toBe(50);
  });

  it("clamps progress to 100 when the threshold is passed", () => {
    const progress = getReferralTierProgress(
      status({ tier: "plus", cumulative_referred_volume: 60000 }),
    );
    expect(progress.percent).toBe(100);
  });

  it("never reports negative remaining volume", () => {
    const progress = getReferralTierProgress(
      status({ tier: "plus", cumulative_referred_volume: 60000 }),
    );
    expect(progress.remaining).toBe(0);
  });

  it("returns the max-tier state at the top tier", () => {
    const progress = getReferralTierProgress(
      status({ tier: "elite", cumulative_referred_volume: 80000 }),
    );
    expect(progress.nextTier).toBeNull();
    expect(progress.percent).toBe(100);
    expect(progress.remaining).toBe(0);
  });

  it("sorts tiers by threshold before looking for the next one", () => {
    const progress = getReferralTierProgress(
      status({
        tier: "plus",
        cumulative_referred_volume: 10000,
        tiers: [
          { tier: "elite", threshold: 50000, commission_rate: 6 },
          { tier: "standard", threshold: 0, commission_rate: 2 },
          { tier: "plus", threshold: 10000, commission_rate: 4 },
        ],
      }),
    );
    expect(progress.nextTier?.tier).toBe("elite");
    expect(progress.percent).toBe(0);
  });
});

describe("getReferralCommissionRate", () => {
  it("returns the commission rate of the current tier", () => {
    expect(getReferralCommissionRate(status({ tier: "plus" }))).toBe(4);
    expect(getReferralCommissionRate(status({ tier: "elite" }))).toBe(6);
  });

  it("falls back to zero when the tier is unknown", () => {
    expect(getReferralCommissionRate(status({ tier: "standard" }))).toBe(2);
    expect(
      getReferralCommissionRate(status({ tier: "standard", tiers: [] })),
    ).toBe(0);
  });
});

describe("referral tier helpers", () => {
  it("labels every tier", () => {
    expect(REFERRAL_TIER_LABELS.standard).toBe("Standard");
    expect(REFERRAL_TIER_LABELS.plus).toBe("Plus");
    expect(REFERRAL_TIER_LABELS.elite).toBe("Elite");
  });

  it("identifies the top tier", () => {
    expect(isMaxReferralTier("elite")).toBe(true);
    expect(isMaxReferralTier("plus")).toBe(false);
  });
});
