/**
 * NAV (net asset value) helpers (issue #546)
 *
 * NAV is the computed fair value of one fraction of an invoice. Comparing it
 * with the price actually being asked tells an investor whether the market is
 * paying a premium (the price sits above NAV) or a discount (the price sits
 * below NAV).
 *
 * These helpers are deliberately free of React so the pricing rules — which
 * decide what a user sees — can be tested directly.
 */

/** Where the current price sits relative to NAV. */
export type NavPosition = "above" | "at" | "below";

/** Prices within this many bps of NAV count as trading at NAV. */
export const NAV_PARITY_BPS = 25;

/** NAV computed longer ago than this is flagged as stale (#546). */
export const NAV_STALE_AFTER_MS = 60 * 60 * 1000;

export const NAV_POSITION_LABELS: Record<NavPosition, string> = {
  above: "Above NAV",
  at: "At NAV",
  below: "Below NAV",
};

export interface NavComparison {
  position: NavPosition;
  /** Price minus NAV, as a percentage of NAV, in basis points. */
  premiumBps: number;
}

/** Coerces a value to a finite number, or null when it is not one. */
function usableNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Compares the current price with the NAV.
 *
 * Returns null when either side is missing, or when the NAV is not a usable
 * number, so a chip with nothing to say is not rendered rather than claiming
 * the invoice is trading "at NAV".
 */
export function compareToNav(
  nav: number | null | undefined,
  price: number | null | undefined
): NavComparison | null {
  const navValue = usableNumber(nav);
  const priceValue = usableNumber(price);
  if (navValue === null || priceValue === null) return null;
  if (navValue <= 0) return null;

  const premiumBps = Math.round(((priceValue - navValue) / navValue) * 10_000);
  const position: NavPosition =
    premiumBps > NAV_PARITY_BPS ? "above" : premiumBps < -NAV_PARITY_BPS ? "below" : "at";

  return { position, premiumBps };
}

/**
 * Phrases the gap between price and NAV as a premium or a discount, e.g.
 * "-424 bps discount". A gap inside the parity band reads as "0 bps".
 */
export function premiumDiscountLabel(premiumBps: number): string {
  if (premiumBps === 0) return "0 bps";
  const sign = premiumBps > 0 ? "+" : "-";
  const side = premiumBps > 0 ? "premium" : "discount";
  return `${sign}${Math.abs(premiumBps)} bps ${side}`;
}

/**
 * True when the NAV was computed more than an hour ago.
 *
 * A missing timestamp is not treated as stale: there is nothing to compare it
 * against, and warning on every invoice whose payload omits the field would be
 * noise rather than a safety net.
 */
export function isNavStale(
  computedAt: string | null | undefined,
  now: number = Date.now()
): boolean {
  if (!computedAt) return false;
  const timestamp = new Date(computedAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  return now - timestamp > NAV_STALE_AFTER_MS;
}

/**
 * Formats a per-fraction price in XLM.
 *
 * Fraction prices are small numbers with more precision than a currency
 * display needs, so trailing zeros are trimmed but four decimals are kept.
 */
export function formatNavPrice(value: number | null | undefined): string {
  const num = usableNumber(value);
  if (num === null) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}
