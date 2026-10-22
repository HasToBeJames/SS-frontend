import { describe, it, expect } from "vitest";
import {
  buildSettlementTimeline,
  formatPaymentAmount,
  formatPaymentDate,
  type InterimPaymentInput,
} from "../settlementTimeline";

function payment(
  overrides: Partial<InterimPaymentInput> = {},
): InterimPaymentInput {
  return {
    id: "p1",
    amount: 1_000,
    paid_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildSettlementTimeline (#478)", () => {
  it("returns an empty ledger when no payments have been made", () => {
    const summary = buildSettlementTimeline([], { totalDue: 10_000 });

    expect(summary.entries).toEqual([]);
    expect(summary.totalPaid).toBe(0);
    expect(summary.remaining).toBe(10_000);
    expect(summary.repaidPercent).toBe(0);
    expect(summary.isFullyRepaid).toBe(false);
  });

  it("orders payments oldest-first and computes a running cumulative total", () => {
    const summary = buildSettlementTimeline(
      [
        payment({ id: "p1", amount: 2_000, paid_at: "2026-01-10T00:00:00.000Z" }),
        payment({ id: "p2", amount: 3_000, paid_at: "2026-01-05T00:00:00.000Z" }),
        payment({
          id: "p3",
          amount: 5_000,
          paid_at: "2026-02-01T00:00:00.000Z",
          is_final: true,
        }),
      ],
      { totalDue: 10_000 },
    );

    expect(summary.entries.map((entry) => entry.id)).toEqual(["p2", "p1", "p3"]);
    expect(summary.entries.map((entry) => entry.cumulativePaid)).toEqual([
      3_000, 5_000, 10_000,
    ]);
    expect(summary.entries.map((entry) => entry.remaining)).toEqual([
      7_000, 5_000, 0,
    ]);
    expect(summary.totalPaid).toBe(10_000);
    expect(summary.remaining).toBe(0);
    expect(summary.repaidPercent).toBe(100);
    expect(summary.isFullyRepaid).toBe(true);
  });

  it("reflects a partial repayment percentage before settlement", () => {
    const summary = buildSettlementTimeline(
      [payment({ id: "p1", amount: 2_500, paid_at: "2026-01-05T00:00:00.000Z" })],
      { totalDue: 10_000 },
    );

    expect(summary.repaidPercent).toBe(25);
    expect(summary.remaining).toBe(7_500);
    expect(summary.isFullyRepaid).toBe(false);
    expect(summary.entries[0].isFinal).toBe(false);
  });

  it("marks the contract-flagged payment as the final settlement", () => {
    const summary = buildSettlementTimeline(
      [
        payment({ id: "p1", amount: 2_000, paid_at: "2026-01-05T00:00:00.000Z" }),
        payment({
          id: "p2",
          amount: 8_000,
          paid_at: "2026-02-05T00:00:00.000Z",
          is_final: true,
        }),
      ],
      { totalDue: 10_000 },
    );

    expect(summary.entries.map((entry) => entry.isFinal)).toEqual([false, true]);
  });

  it("badges the last payment as final when the invoice is settled", () => {
    const summary = buildSettlementTimeline(
      [
        payment({ id: "p1", amount: 2_000, paid_at: "2026-01-05T00:00:00.000Z" }),
        payment({ id: "p2", amount: 8_000, paid_at: "2026-02-05T00:00:00.000Z" }),
      ],
      { totalDue: 10_000, isSettled: true },
    );

    expect(summary.entries[1].isFinal).toBe(true);
  });

  it("clamps an overpayment to a zero balance and 100%", () => {
    const summary = buildSettlementTimeline(
      [payment({ id: "p1", amount: 12_000, paid_at: "2026-01-05T00:00:00.000Z" })],
      { totalDue: 10_000 },
    );

    expect(summary.entries[0].cumulativePaid).toBe(12_000);
    expect(summary.entries[0].remaining).toBe(0);
    expect(summary.repaidPercent).toBe(100);
    expect(summary.isFullyRepaid).toBe(true);
  });

  it("treats negative or non-finite amounts as zero", () => {
    const summary = buildSettlementTimeline(
      [
        payment({ id: "p1", amount: -50 }),
        payment({ id: "p2", amount: Number.NaN }),
        payment({ id: "p3", amount: 1_000 }),
      ],
      { totalDue: 10_000 },
    );

    expect(summary.totalPaid).toBe(1_000);
    expect(summary.entries.map((entry) => entry.amount)).toEqual([0, 0, 1_000]);
  });

  it("does not divide by zero when the amount due is unknown", () => {
    const summary = buildSettlementTimeline([payment({ amount: 500 })], {
      totalDue: 0,
    });

    expect(summary.repaidPercent).toBe(0);
    expect(summary.remaining).toBe(0);
    expect(summary.isFullyRepaid).toBe(false);
  });
});

describe("formatting helpers", () => {
  it("formats payment amounts with thousands separators", () => {
    expect(formatPaymentAmount(1_234.5)).toBe("1,234.5 XLM");
    expect(formatPaymentAmount(0)).toBe("0 XLM");
  });

  it("formats payment dates and falls back to an em dash for invalid input", () => {
    expect(formatPaymentDate("2026-01-05T12:00:00.000Z")).toMatch(/2026/);
    expect(formatPaymentDate("not-a-date")).toBe("—");
  });
});
