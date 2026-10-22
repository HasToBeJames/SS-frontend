import { describe, it, expect } from "vitest";
import {
  nextExecutionDate,
  projectedAnnualInvestment,
  validateSubscriptionAmount,
} from "../poolSubscriptions";

// Local-time constructor so the day arithmetic does not depend on the runner's timezone.
const from = new Date(2026, 9, 1);

describe("pool subscriptions (#544)", () => {
  it("advances the next execution by one interval", () => {
    expect(nextExecutionDate("daily", from)).toEqual(new Date(2026, 9, 2));
    expect(nextExecutionDate("weekly", from)).toEqual(new Date(2026, 9, 8));
    expect(nextExecutionDate("monthly", from)).toEqual(new Date(2026, 10, 1));
  });

  it("projects a full year of executions at the chosen cadence", () => {
    expect(projectedAnnualInvestment(100, "daily")).toBe(36_500);
    expect(projectedAnnualInvestment(100, "weekly")).toBe(5_200);
    expect(projectedAnnualInvestment(100, "monthly")).toBe(1_200);
  });

  it("requires a positive amount per execution", () => {
    expect(validateSubscriptionAmount("").valid).toBe(false);
    expect(validateSubscriptionAmount("0").valid).toBe(false);
    expect(validateSubscriptionAmount("-5").valid).toBe(false);
    expect(validateSubscriptionAmount("12.5")).toEqual({ valid: true, amount: 12.5 });
  });
});
