import type { InvoiceOrderBook, OrderBookLevel } from "@/lib/api";

export interface DepthPoint {
  price: number;
  /** Cumulative bid volume at or above this price; null on the ask side. */
  bidDepth: number | null;
  /** Cumulative ask volume at or below this price; null on the bid side. */
  askDepth: number | null;
}

function validLevels(levels: OrderBookLevel[] | undefined): OrderBookLevel[] {
  return (levels ?? []).filter(
    (l) =>
      Number.isFinite(l.price) && l.price > 0 && Number.isFinite(l.quantity) && l.quantity > 0,
  );
}

function mergeByPrice(levels: OrderBookLevel[]): OrderBookLevel[] {
  const byPrice = new Map<number, number>();
  for (const l of levels) byPrice.set(l.price, (byPrice.get(l.price) ?? 0) + l.quantity);
  return [...byPrice].map(([price, quantity]) => ({ price, quantity }));
}

/**
 * Bids accumulate from the best (highest) price downwards, asks from the best
 * (lowest) price upwards, so depth grows away from the mid-price on both sides.
 * Returned ascending by price.
 */
export function buildDepthData(book: InvoiceOrderBook): DepthPoint[] {
  const bids = mergeByPrice(validLevels(book.bids)).sort((a, b) => b.price - a.price);
  const asks = mergeByPrice(validLevels(book.asks)).sort((a, b) => a.price - b.price);

  let total = 0;
  const bidPoints: DepthPoint[] = bids.map((l) => {
    total += l.quantity;
    return { price: l.price, bidDepth: total, askDepth: null };
  });
  total = 0;
  const askPoints: DepthPoint[] = asks.map((l) => {
    total += l.quantity;
    return { price: l.price, bidDepth: null, askDepth: total };
  });

  return [...bidPoints.reverse(), ...askPoints];
}

export function midPrice(book: InvoiceOrderBook): number | null {
  if (book.mid_price != null && Number.isFinite(book.mid_price) && book.mid_price > 0) {
    return book.mid_price;
  }
  const bids = validLevels(book.bids).map((l) => l.price);
  const asks = validLevels(book.asks).map((l) => l.price);
  const bestBid = bids.length ? Math.max(...bids) : 0;
  const bestAsk = asks.length ? Math.min(...asks) : 0;
  if (bestBid && bestAsk) return (bestBid + bestAsk) / 2;
  return bestBid || bestAsk || null;
}
