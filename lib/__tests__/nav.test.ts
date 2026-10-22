import { describe, it, expect } from "vitest";
import {
  compareToNav,
  formatNavPrice,
  isNavStale,
  NAV_PARITY_BPS,
  NAV_STALE_AFTER_MS,
  premiumDiscountLabel,
} from "../nav";

describe("compareToNav (#546)", () => {
  it("rates a price above the NAV as above", () => {
    const result = compareToNav(1, 1.1);
    expect(result?.position).toBe("above");
    expect(result?.premiumBps).toBe(1000);
  });

  it("rates a price below the NAV as below", () => {
    const result = compareToNav(1, 0.9);
    expect(result?.position).toBe("below");
    expect(result?.premiumBps).toBe(-1000);
  });

  it("rates a price within the parity band as at NAV", () => {
    expect(compareToNav(1, 1)?.position).toBe("at");
    expect(compareToNav(1, 1 + NAV_PARITY_BPS / 10_000)?.position).toBe("at");
    expect(compareToNav(1, 1 - NAV_PARITY_BPS / 10_000)?.position).toBe("at");
  });

  it("steps outside the parity band just past the threshold", () => {
    expect(compareToNav(1, 1 + (NAV_PARITY_BPS + 1) / 10_000)?.position).toBe("above");
    expect(compareToNav(1, 1 - (NAV_PARITY_BPS + 1) / 10_000)?.position).toBe("below");
  });

  it("expresses the gap relative to the NAV, not the price", () => {
    // Price 2.20 against a NAV of 2.00 is a 10% premium either way round, but
    // the basis points must be measured against the NAV.
    expect(compareToNav(2, 2.2)?.premiumBps).toBe(1000);
    expect(compareToNav(0.5, 0.55)?.premiumBps).toBe(1000);
  });

  it("returns null when either side is missing", () => {
    expect(compareToNav(null, 1)).toBeNull();
    expect(compareToNav(1, null)).toBeNull();
    expect(compareToNav(undefined, undefined)).toBeNull();
  });

  it("returns null for a NAV that cannot be divided into", () => {
    expect(compareToNav(0, 1)).toBeNull();
    expect(compareToNav(-1, 1)).toBeNull();
    expect(compareToNav(Number.NaN, 1)).toBeNull();
  });
});

describe("premiumDiscountLabel", () => {
  it("signs a premium", () => {
    expect(premiumDiscountLabel(120)).toBe("+120 bps premium");
  });

  it("signs a discount", () => {
    expect(premiumDiscountLabel(-120)).toBe("-120 bps discount");
  });

  it("reads a gap inside the parity band as zero", () => {
    expect(premiumDiscountLabel(0)).toBe("0 bps");
  });
});

describe("isNavStale (#546)", () => {
  const now = new Date("2026-10-21T12:00:00.000Z").getTime();

  it("flags a NAV computed more than an hour ago", () => {
    const computedAt = new Date(now - NAV_STALE_AFTER_MS - 1000).toISOString();
    expect(isNavStale(computedAt, now)).toBe(true);
  });

  it("does not flag a NAV computed within the hour", () => {
    const computedAt = new Date(now - NAV_STALE_AFTER_MS + 60_000).toISOString();
    expect(isNavStale(computedAt, now)).toBe(false);
  });

  it("does not flag a NAV with no timestamp, because there is nothing to compare", () => {
    expect(isNavStale(null, now)).toBe(false);
    expect(isNavStale(undefined, now)).toBe(false);
    expect(isNavStale("not-a-date", now)).toBe(false);
  });
});

describe("formatNavPrice", () => {
  it("keeps up to four decimals and trims trailing zeros", () => {
    expect(formatNavPrice(1.0234)).toBe("1.0234");
    expect(formatNavPrice(1.5)).toBe("1.5");
    expect(formatNavPrice(1)).toBe("1");
  });

  it("falls back to a dash when there is no price", () => {
    expect(formatNavPrice(null)).toBe("—");
    expect(formatNavPrice(undefined)).toBe("—");
    expect(formatNavPrice(Number.NaN)).toBe("—");
  });
});
