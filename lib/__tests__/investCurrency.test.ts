import { describe, expect, it } from "vitest";
import {
  INVEST_CURRENCIES,
  InvestError,
  FX_STALE_AFTER_SECONDS,
  formatRateAge,
  investErrorMessage,
  isRateStale,
  parseInvestError,
  rateAgeSeconds,
  toBaseAmount,
} from "@/lib/investCurrency";

describe("investCurrency", () => {
  it("supports USDC, EURC and NGNC", () => {
    expect([...INVEST_CURRENCIES]).toEqual(["USDC", "EURC", "NGNC"]);
  });

  it("converts to the base currency", () => {
    expect(toBaseAmount(100, 1.08)).toBeCloseTo(108);
    expect(toBaseAmount(0, 1.08)).toBe(0);
    expect(toBaseAmount(100, 0)).toBe(0);
  });

  it("computes rate age and staleness", () => {
    const now = Date.parse("2026-01-01T00:10:00Z");
    expect(rateAgeSeconds("2026-01-01T00:08:00Z", now)).toBe(120);
    expect(isRateStale("2026-01-01T00:08:00Z", now)).toBe(false);
    expect(isRateStale("2026-01-01T00:00:00Z", now)).toBe(true);
    expect(FX_STALE_AFTER_SECONDS).toBe(300);
  });

  it("formats age", () => {
    expect(formatRateAge(45)).toBe("45s ago");
    expect(formatRateAge(125)).toBe("2m ago");
    expect(formatRateAge(7300)).toBe("2h ago");
  });

  it("maps contract errors to typed errors and messages", () => {
    const unsupported = parseInvestError({ error: "UnsupportedCurrency" });
    const stale = parseInvestError({ code: "StalePrice" });
    expect(unsupported.code).toBe("UnsupportedCurrency");
    expect(stale.code).toBe("StalePrice");
    expect(parseInvestError(null).code).toBe("Unknown");
    expect(investErrorMessage(unsupported, "NGNC")).toMatch(/NGNC is not supported/);
    expect(investErrorMessage(stale, "EURC")).toMatch(/out of date/);
    expect(investErrorMessage(new Error("x"), "EURC")).toBeNull();
    expect(new InvestError("Unknown", "x").name).toBe("InvestError");
  });
});
