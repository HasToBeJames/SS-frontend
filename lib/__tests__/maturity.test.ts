import { describe, expect, it } from "vitest";
import { computeLatePenalty, getMaturityState } from "@/lib/maturity";

const DAY = 24 * 60 * 60 * 1000;
const MATURITY = "2026-01-01T00:00:00Z";
const at = (daysAfter: number) => Date.parse(MATURITY) + daysAfter * DAY - 1000;

describe("getMaturityState", () => {
  it("is upcoming before the maturity date", () => {
    const s = getMaturityState(MATURITY, Date.parse(MATURITY) - DAY);
    expect(s.phase).toBe("upcoming");
    expect(s.daysOverdue).toBe(0);
  });

  it("is in the grace period for the first 7 days", () => {
    const s = getMaturityState(MATURITY, at(3));
    expect(s.phase).toBe("grace");
    expect(s.daysOverdue).toBe(3);
    expect(s.graceDaysRemaining).toBe(4);
    expect(getMaturityState(MATURITY, at(7)).phase).toBe("grace");
  });

  it("accrues a penalty after the grace period", () => {
    const s = getMaturityState(MATURITY, at(10));
    expect(s.phase).toBe("penalty");
    expect(s.penaltyDays).toBe(3);
    expect(s.daysUntilDefault).toBeNull();
  });

  it("shows the default countdown at 15+ days overdue", () => {
    const s = getMaturityState(MATURITY, at(15));
    expect(s.phase).toBe("default_risk");
    expect(s.daysUntilDefault).toBe(15);
  });

  it("is defaulted at 30 days overdue", () => {
    expect(getMaturityState(MATURITY, at(30)).phase).toBe("defaulted");
  });
});

describe("computeLatePenalty", () => {
  it("charges 10 bps of face value per penalty day", () => {
    expect(computeLatePenalty(10_000, 3)).toBeCloseTo(30);
  });

  it("is zero without penalty days or face value", () => {
    expect(computeLatePenalty(10_000, 0)).toBe(0);
    expect(computeLatePenalty(0, 5)).toBe(0);
  });
});
