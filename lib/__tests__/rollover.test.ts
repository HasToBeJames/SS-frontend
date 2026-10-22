import { describe, it, expect } from "vitest";
import {
  rolloverToDraft,
  toRolloverConfig,
  toRolloverConfigPayload,
  validateRolloverConfig,
  type RolloverDraft,
} from "../rollover";

const validDraft: RolloverDraft = {
  sector: "energy",
  minYield: "6",
  maxInvoiceAgeDays: "60",
  maxAmount: "2000",
};

describe("rollover validation (#545)", () => {
  it("accepts a complete draft and parses it", () => {
    const result = validateRolloverConfig(validDraft);
    expect(result.valid).toBe(true);
    expect(result.config).toEqual({
      sector: "energy",
      minYield: 6,
      maxInvoiceAgeDays: 60,
      maxAmount: 2000,
    });
  });

  it("requires a sector and every numeric criterion", () => {
    const result = validateRolloverConfig({
      sector: "",
      minYield: "",
      maxInvoiceAgeDays: "",
      maxAmount: "",
    });
    expect(result.valid).toBe(false);
    expect(result.config).toBeNull();
    expect(Object.keys(result.errors).sort()).toEqual(
      ["maxAmount", "maxInvoiceAgeDays", "minYield", "sector"].sort(),
    );
  });

  it("rejects out-of-range values", () => {
    const result = validateRolloverConfig({
      ...validDraft,
      minYield: "101",
      maxInvoiceAgeDays: "1.5",
      maxAmount: "0",
    });
    expect(result.errors.minYield).toBeDefined();
    expect(result.errors.maxInvoiceAgeDays).toBeDefined();
    expect(result.errors.maxAmount).toBeDefined();
  });
});

describe("rollover mapping (#545)", () => {
  it("seeds the form from a saved config, or defaults for a new one", () => {
    expect(rolloverToDraft(null)).toEqual({
      sector: "",
      minYield: "5",
      maxInvoiceAgeDays: "30",
      maxAmount: "1000",
    });
    expect(
      rolloverToDraft({ sector: "energy", minYield: 6, maxInvoiceAgeDays: 60, maxAmount: 2000 }),
    ).toEqual(validDraft);
  });

  it("maps the wire payload to the domain config and back", () => {
    const config = toRolloverConfig({
      sector: "energy",
      min_yield: 6,
      max_invoice_age: 60,
      max_amount: 2000,
      is_enabled: true,
    });
    expect(config).toEqual({
      sector: "energy",
      minYield: 6,
      maxInvoiceAgeDays: 60,
      maxAmount: 2000,
      isEnabled: true,
      updatedAt: undefined,
    });
    expect(toRolloverConfigPayload(config!, false)).toEqual({
      sector: "energy",
      min_yield: 6,
      max_invoice_age: 60,
      max_amount: 2000,
      is_enabled: false,
    });
  });

  it("drops a config whose sector is no longer recognised", () => {
    expect(
      toRolloverConfig({
        sector: "retired_sector",
        min_yield: 5,
        max_invoice_age: 30,
        max_amount: 1000,
        is_enabled: true,
      }),
    ).toBeNull();
  });
});
