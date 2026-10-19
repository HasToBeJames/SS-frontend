import { describe, expect, it } from "vitest";
import { buildDepthData, midPrice } from "@/lib/orderBook";

const book = {
  bids: [
    { price: 0.9, quantity: 10 },
    { price: 0.95, quantity: 5 },
    { price: 0.8, quantity: 20 },
  ],
  asks: [
    { price: 1.1, quantity: 7 },
    { price: 1.05, quantity: 3 },
    { price: 1.05, quantity: 2 },
  ],
};

describe("buildDepthData", () => {
  it("accumulates bids downward from the best bid", () => {
    const bids = buildDepthData(book).filter((p) => p.bidDepth !== null);
    expect(bids.map((p) => [p.price, p.bidDepth])).toEqual([
      [0.8, 35],
      [0.9, 15],
      [0.95, 5],
    ]);
  });

  it("accumulates asks upward and merges equal prices", () => {
    const asks = buildDepthData(book).filter((p) => p.askDepth !== null);
    expect(asks.map((p) => [p.price, p.askDepth])).toEqual([
      [1.05, 5],
      [1.1, 12],
    ]);
  });

  it("is ascending by price and drops invalid levels", () => {
    const data = buildDepthData({ bids: [{ price: 1, quantity: 0 }, { price: NaN, quantity: 1 }], asks: [] });
    expect(data).toEqual([]);
    const prices = buildDepthData(book).map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});

describe("midPrice", () => {
  it("uses API mid when present", () => {
    expect(midPrice({ ...book, mid_price: 1 })).toBe(1);
  });
  it("derives from best bid and ask", () => {
    expect(midPrice(book)).toBeCloseTo(1.0, 10);
  });
  it("falls back to one side or null", () => {
    expect(midPrice({ bids: [{ price: 2, quantity: 1 }], asks: [] })).toBe(2);
    expect(midPrice({ bids: [], asks: [] })).toBeNull();
  });
});
