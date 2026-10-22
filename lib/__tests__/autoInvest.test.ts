import { describe, it, expect } from "vitest";
import {
  DEFAULT_AUTO_INVEST_RULE,
  formatSectors,
  isAutoInvestSector,
  ruleToDraft,
  toAutoInvestRule,
  toAutoInvestRulePayload,
  validateAutoInvestRule,
  type AutoInvestRuleDraft,
} from "../autoInvest";

const VALID_DRAFT: AutoInvestRuleDraft = {
  sectors: ["trade_finance", "sme"],
  minYield: "7.5",
  maxInvoiceAgeDays: "45",
  maxAmountPerInvoice: "2500",
};

describe("validateAutoInvestRule (#476)", () => {
  it("parses a complete draft into a rule", () => {
    const result = validateAutoInvestRule(VALID_DRAFT);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.rule).toEqual({
      sectors: ["trade_finance", "sme"],
      minYield: 7.5,
      maxInvoiceAgeDays: 45,
      maxAmountPerInvoice: 2500,
    });
  });

  it("requires at least one sector", () => {
    const result = validateAutoInvestRule({ ...VALID_DRAFT, sectors: [] });

    expect(result.valid).toBe(false);
    expect(result.errors.sectors).toMatch(/at least one sector/i);
    expect(result.rule).toBeNull();
  });

  it("rejects an empty minimum yield", () => {
    const result = validateAutoInvestRule({ ...VALID_DRAFT, minYield: "" });
    expect(result.errors.minYield).toMatch(/required/i);
  });

  it("rejects a yield outside 0-100", () => {
    expect(
      validateAutoInvestRule({ ...VALID_DRAFT, minYield: "120" }).errors.minYield,
    ).toMatch(/between 0 and 100/i);
    expect(
      validateAutoInvestRule({ ...VALID_DRAFT, minYield: "-5" }).errors.minYield,
    ).toMatch(/between 0 and 100/i);
  });

  it("rejects a non-integer or out-of-range invoice age", () => {
    expect(
      validateAutoInvestRule({ ...VALID_DRAFT, maxInvoiceAgeDays: "3.5" }).errors
        .maxInvoiceAgeDays,
    ).toMatch(/whole number/i);
    expect(
      validateAutoInvestRule({ ...VALID_DRAFT, maxInvoiceAgeDays: "0" }).errors
        .maxInvoiceAgeDays,
    ).toMatch(/whole number/i);
    expect(
      validateAutoInvestRule({ ...VALID_DRAFT, maxInvoiceAgeDays: "" }).errors
        .maxInvoiceAgeDays,
    ).toMatch(/required/i);
  });

  it("rejects an empty or non-positive amount", () => {
    expect(
      validateAutoInvestRule({ ...VALID_DRAFT, maxAmountPerInvoice: "" }).errors
        .maxAmountPerInvoice,
    ).toMatch(/required/i);
    expect(
      validateAutoInvestRule({ ...VALID_DRAFT, maxAmountPerInvoice: "0" }).errors
        .maxAmountPerInvoice,
    ).toMatch(/greater than 0/i);
  });

  it("ignores unknown sector values", () => {
    const result = validateAutoInvestRule({
      ...VALID_DRAFT,
      sectors: ["trade_finance", "not-a-sector"],
    });

    expect(result.valid).toBe(true);
    expect(result.rule?.sectors).toEqual(["trade_finance"]);
  });
});

describe("autoInvest helpers", () => {
  it("validates sector strings", () => {
    expect(isAutoInvestSector("healthcare")).toBe(true);
    expect(isAutoInvestSector("space")).toBe(false);
  });

  it("formats sector labels", () => {
    expect(formatSectors(["trade_finance", "sme"])).toBe("Trade finance, SME");
    expect(formatSectors([])).toBe("Any sector");
  });

  it("round-trips a draft from a rule", () => {
    const rule = {
      sectors: ["energy" as const],
      minYield: 9,
      maxInvoiceAgeDays: 14,
      maxAmountPerInvoice: 500,
    };

    expect(ruleToDraft(rule)).toEqual({
      sectors: ["energy"],
      minYield: "9",
      maxInvoiceAgeDays: "14",
      maxAmountPerInvoice: "500",
    });
    expect(ruleToDraft(null)).toEqual(ruleToDraft(DEFAULT_AUTO_INVEST_RULE));
  });

  it("maps the wire payload both ways, dropping unknown sectors", () => {
    const rule = toAutoInvestRule({
      sectors: ["trade_finance", "unknown"],
      min_yield: 6,
      max_invoice_age_days: 21,
      max_amount_per_invoice: 1500,
      is_enabled: true,
      updated_at: "2026-10-01T00:00:00.000Z",
    });

    expect(rule).toEqual({
      sectors: ["trade_finance"],
      minYield: 6,
      maxInvoiceAgeDays: 21,
      maxAmountPerInvoice: 1500,
      isEnabled: true,
      updatedAt: "2026-10-01T00:00:00.000Z",
    });

    expect(toAutoInvestRulePayload(rule, false)).toEqual({
      sectors: ["trade_finance"],
      min_yield: 6,
      max_invoice_age_days: 21,
      max_amount_per_invoice: 1500,
      is_enabled: false,
    });
  });
});
