import { describe, it, expect } from "vitest";
import { allocatePool, weightedAverageYield } from "../pools";
import type { PoolInvoice } from "../api";

const basket: PoolInvoice[] = [
  { invoice_id: "a", name: "A", sector: "sme", weight: 50, yield_percentage: 10 },
  { invoice_id: "b", name: "B", sector: "real_estate", weight: 30, yield_percentage: 8 },
  { invoice_id: "c", name: "C", sector: "trade_finance", weight: 20, yield_percentage: 5 },
];

describe("weightedAverageYield", () => {
  it("weights each yield by its share of the pool", () => {
    expect(weightedAverageYield(basket)).toBeCloseTo(8.4);
  });

  it("returns 0 for an empty pool", () => {
    expect(weightedAverageYield([])).toBe(0);
  });
});

describe("allocatePool", () => {
  it("splits the amount pro rata by weight", () => {
    expect(allocatePool(1000, basket).map((a) => a.amount)).toEqual([500, 300, 200]);
  });

  it("always sums to the amount entered", () => {
    const thirds: PoolInvoice[] = [1, 2, 3].map((n) => ({
      invoice_id: String(n),
      name: String(n),
      sector: "sme",
      weight: 100 / 3,
      yield_percentage: 5,
    }));
    const total = allocatePool(100, thirds).reduce((sum, a) => sum + Math.round(a.amount * 100), 0);
    expect(total).toBe(10000);
  });

  it("returns zero allocations for a non-positive amount", () => {
    expect(allocatePool(0, basket).every((a) => a.amount === 0)).toBe(true);
  });
});
