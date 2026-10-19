import { describe, expect, it } from "vitest";
import { calculateReturns, daysUntil, parseAmount } from "@/lib/returnsCalculator";

describe("calculateReturns", () => {
  const base = { fractionPrice: 2, faceValue: 10_000, yieldPercentage: 12, daysRemaining: 73 };

  it("buys whole fractions only", () => {
    expect(calculateReturns({ ...base, amount: 101 }).fractionCount).toBe(50);
  });

  it("computes share of total supply", () => {
    const r = calculateReturns({ ...base, amount: 500 });
    expect(r.totalFractions).toBe(5000);
    expect(r.shareOfSupply).toBeCloseTo(5, 6);
  });

  it("computes yield on invested amount over days/365", () => {
    const r = calculateReturns({ ...base, amount: 1000 });
    expect(r.projectedYield).toBeCloseTo(1000 * 0.12 * (73 / 365), 6);
    expect(r.projectedPayout).toBeCloseTo(1000 + r.projectedYield, 6);
  });

  it("returns zeros for empty or invalid input", () => {
    const r = calculateReturns({ ...base, amount: NaN });
    expect(r.fractionCount).toBe(0);
    expect(r.projectedYield).toBe(0);
    expect(r.shareOfSupply).toBe(0);
  });
});

describe("daysUntil / parseAmount", () => {
  it("rounds up and floors at zero", () => {
    const now = Date.UTC(2026, 0, 1);
    expect(daysUntil("2026-01-11T00:00:00Z", now)).toBe(10);
    expect(daysUntil("2025-12-01T00:00:00Z", now)).toBe(0);
    expect(daysUntil(null, now)).toBe(0);
  });
  it("parses invalid text to 0", () => {
    expect(parseAmount("abc")).toBe(0);
    expect(parseAmount("-5")).toBe(0);
    expect(parseAmount("12.5")).toBe(12.5);
  });
});
