/**
 * Multi-currency investment helpers (issue #497).
 *
 * Investors may pay in USDC, EURC or NGNC. The contract normalises every
 * payment into the base currency (USDC) using an oracle price, and rejects
 * unsupported currencies (UnsupportedCurrency) and prices older than the
 * oracle window (StalePrice).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const INVEST_CURRENCIES = ["USDC", "EURC", "NGNC"] as const;
export type InvestCurrency = (typeof INVEST_CURRENCIES)[number];
export const BASE_CURRENCY: InvestCurrency = "USDC";

/** Oracle prices older than this are rejected by the contract. */
export const FX_STALE_AFTER_SECONDS = 5 * 60;

export interface FxRate {
  currency: InvestCurrency;
  /** Units of the base currency (USDC) per 1 unit of `currency`. */
  rate: number;
  /** ISO timestamp of the oracle price. */
  updated_at: string;
}

export type InvestErrorCode = "UnsupportedCurrency" | "StalePrice" | "Unknown";

export class InvestError extends Error {
  constructor(
    public readonly code: InvestErrorCode,
    message: string
  ) {
    super(message);
    this.name = "InvestError";
  }
}

export function isInvestCurrency(value: string): value is InvestCurrency {
  return (INVEST_CURRENCIES as readonly string[]).includes(value);
}

/** Converts an amount in the selected currency to the base currency. */
export function toBaseAmount(amount: number, rate: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || amount <= 0 || rate <= 0) {
    return 0;
  }
  return amount * rate;
}

export function rateAgeSeconds(updatedAt: string, now: number = Date.now()): number {
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now - t) / 1000));
}

export function isRateStale(updatedAt: string, now: number = Date.now()): boolean {
  return rateAgeSeconds(updatedAt, now) > FX_STALE_AFTER_SECONDS;
}

export function formatRateAge(seconds: number): string {
  if (!Number.isFinite(seconds)) return "unknown";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function investErrorMessage(error: unknown, currency: InvestCurrency): string | null {
  if (!(error instanceof InvestError)) return null;
  if (error.code === "UnsupportedCurrency") {
    return `${currency} is not supported for this invoice. Choose another currency.`;
  }
  if (error.code === "StalePrice") {
    return `The ${currency} exchange rate is out of date. Wait for a fresh rate and try again.`;
  }
  return null;
}

/** Maps a failed invest response body to a typed error. */
export function parseInvestError(body: unknown): InvestError {
  const raw =
    body && typeof body === "object"
      ? String(
          (body as { error?: unknown; code?: unknown }).code ??
            (body as { error?: unknown }).error ??
            ""
        )
      : "";
  if (/unsupported_?currency/i.test(raw)) {
    return new InvestError("UnsupportedCurrency", "Unsupported currency");
  }
  if (/stale_?price/i.test(raw)) {
    return new InvestError("StalePrice", "Stale price");
  }
  return new InvestError("Unknown", "Investment failed");
}

export async function fetchFxRate(
  currency: InvestCurrency,
  signal?: AbortSignal
): Promise<FxRate> {
  const res = await fetch(`${API_BASE}/rates/${currency.toLowerCase()}-${BASE_CURRENCY.toLowerCase()}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch ${currency} rate`);
  const data = (await res.json()) as { rate: number; updated_at: string };
  return { currency, rate: data.rate, updated_at: data.updated_at };
}
