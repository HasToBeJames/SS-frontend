import { describe, it, expect } from "vitest";
import { isTargetMet, syndicateGap, validateCoInvestAmount } from "../syndicate";

describe("validateCoInvestAmount", () => {
  it("rejects amounts below the minimum", () => {
    expect(validateCoInvestAmount(50, 100)).toMatch(/below the minimum/);
  });

  it("accepts amounts at or above the minimum", () => {
    expect(validateCoInvestAmount(100, 100)).toBeNull();
  });

  it("rejects empty or non-positive amounts", () => {
    expect(validateCoInvestAmount(NaN, 100)).not.toBeNull();
    expect(validateCoInvestAmount(0, 100)).not.toBeNull();
  });
});

describe("syndicate target", () => {
  it("computes the remaining gap", () => {
    expect(syndicateGap({ target: 1000, committed: 400 })).toBe(600);
    expect(syndicateGap({ target: 1000, committed: 1200 })).toBe(0);
  });

  it("detects when the target is met", () => {
    expect(isTargetMet({ target: 1000, committed: 1000 })).toBe(true);
    expect(isTargetMet({ target: 1000, committed: 999 })).toBe(false);
  });
});
