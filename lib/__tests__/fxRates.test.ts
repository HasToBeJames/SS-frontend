import { describe, expect, it } from "vitest";
import {
  FX_ORACLE_STALE_AFTER_MS,
  describeExchangeRate,
  formatFiat,
  isRateStale,
  parseFxRates,
  rateFor,
  readStoredRate,
  writeStoredRate,
  type ExchangeRate,
} from "@/lib/currency";

const now = Date.UTC(2026, 5, 1, 12);
const fx: ExchangeRate = {
  rate: 0.25,
  fetchedAt: now,
  rates: { USD: 0.25, EUR: 0.23, NGN: 380 },
  oracleUpdatedAt: now,
};

describe("rateFor / formatFiat", () => {
  it("picks the rate of each currency", () => {
    expect(rateFor(fx, "USD")).toBe(0.25);
    expect(rateFor(fx, "EUR")).toBe(0.23);
    expect(rateFor(fx, "NGN")).toBe(380);
    expect(rateFor(fx, "XLM")).toBeNull();
    expect(rateFor(null, "USD")).toBeNull();
  });

  it("falls back to the plain USD rate and has no EUR rate then", () => {
    const legacy = { rate: 0.2, fetchedAt: now };
    expect(rateFor(legacy, "USD")).toBe(0.2);
    expect(rateFor(legacy, "EUR")).toBeNull();
  });

  it("converts 1000 XLM into each currency", () => {
    expect(formatFiat(1000 * 0.25, "USD")).toBe("$250.00");
    expect(formatFiat(1000 * 0.23, "EUR")).toBe("€230.00");
    expect(formatFiat(1000 * 380, "NGN")).toMatch(/380,000\.00/);
  });
});

describe("oracle staleness", () => {
  it("is fresh at exactly one hour and stale after", () => {
    expect(isRateStale(fx, now + FX_ORACLE_STALE_AFTER_MS)).toBe(false);
    expect(isRateStale(fx, now + FX_ORACLE_STALE_AFTER_MS + 1)).toBe(true);
  });

  it("uses the oracle timestamp, not the fetch time", () => {
    const old = { ...fx, fetchedAt: now, oracleUpdatedAt: now - 2 * 3_600_000 };
    expect(isRateStale(old, now)).toBe(true);
    expect(describeExchangeRate(old, now, "EUR")).toContain("out of date");
  });

  it("names the stablecoin and oracle in the disclaimer", () => {
    const text = describeExchangeRate(fx, now, "EUR");
    expect(text).toContain("EURC");
    expect(text).toContain("FX oracle");
    expect(text).toContain("€0.2300");
  });
});

describe("parseFxRates", () => {
  it("parses oracle rates and timestamp", () => {
    const parsed = parseFxRates({
      rates: { USD: 0.25, EUR: "0.23", NGN: 380 },
      updated_at: "2026-06-01T11:00:00Z",
    });
    expect(parsed.rates).toEqual({ USD: 0.25, EUR: 0.23, NGN: 380 });
    expect(parsed.updatedAt).toBe(Date.UTC(2026, 5, 1, 11));
  });

  it("rejects responses without a USDC rate", () => {
    expect(() => parseFxRates({ rates: { EUR: 0.2 } })).toThrow();
    expect(() => parseFxRates(null)).toThrow();
  });
});

describe("rate cache", () => {
  it("round-trips multi-currency rates", () => {
    writeStoredRate(fx);
    expect(readStoredRate()).toEqual(fx);
  });
});
