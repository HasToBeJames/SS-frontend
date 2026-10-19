import { describe, expect, it } from "vitest";
import { bpsToPercent, canCoverFee, computeListingFee } from "@/lib/listingFee";

describe("listingFee", () => {
  it("computes fee and net proceeds", () => {
    const p = computeListingFee(10, 50, 200);
    expect(p.gross).toBe(500);
    expect(p.fee).toBe(10);
    expect(p.netProceeds).toBe(490);
  });

  it("returns zeros for invalid input", () => {
    expect(computeListingFee(0, 50, 200)).toEqual({ gross: 0, fee: 0, netProceeds: 0 });
    expect(computeListingFee(10, NaN, 200).fee).toBe(0);
  });

  it("formats basis points", () => {
    expect(bpsToPercent(250)).toBe("2.5%");
  });

  it("detects insufficient balance, treating unknown as sufficient", () => {
    expect(canCoverFee(5, 10)).toBe(false);
    expect(canCoverFee(10, 10)).toBe(true);
    expect(canCoverFee(null, 10)).toBe(true);
  });
});
