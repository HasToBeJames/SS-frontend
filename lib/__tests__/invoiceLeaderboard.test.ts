import { describe, it, expect } from "vitest";
import type { InvoiceLeaderboardEntry } from "../api";
import { LEADERBOARD_SIZE, formatLeaderboardValue, rankEntries } from "../invoiceLeaderboard";

const entry = (i: number, sector = "sme"): InvoiceLeaderboardEntry => ({
  invoice_id: `inv-${i}`,
  invoice_name: `Invoice ${i}`,
  issuer: `Issuer ${i}`,
  metric_value: 100 - i,
  sector,
});

describe("invoice leaderboard (#527)", () => {
  it("caps the list at 50 and numbers positions from 1", () => {
    const ranked = rankEntries(Array.from({ length: 60 }, (_, i) => entry(i)), null);
    expect(ranked).toHaveLength(LEADERBOARD_SIZE);
    expect(ranked[0].position).toBe(1);
    expect(ranked[49].position).toBe(50);
  });

  it("filters by sector without renumbering positions", () => {
    const entries = [entry(0, "sme"), entry(1, "real_estate"), entry(2, "sme"), entry(3, "real_estate")];
    const ranked = rankEntries(entries, "real_estate");
    expect(ranked.map((r) => [r.invoice_id, r.position])).toEqual([
      ["inv-1", 2],
      ["inv-3", 4],
    ]);
  });

  it("formats each metric", () => {
    expect(formatLeaderboardValue("yield_rate", 12.34)).toBe("12.3%");
    expect(formatLeaderboardValue("settlement_speed", 4)).toBe("4.0 days");
    expect(formatLeaderboardValue("issuer_reputation", 87.4)).toBe("87/100");
  });
});
