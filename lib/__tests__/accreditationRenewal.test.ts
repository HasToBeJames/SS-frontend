import { describe, it, expect } from "vitest";
import { getRenewalCountdown, getRenewalSeverity } from "../accreditationRenewal";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-10-01T00:00:00Z");
const expiringIn = (days: number) => new Date(now + days * DAY).toISOString();

describe("accreditation renewal severity (#543)", () => {
  it("stays hidden while more than 60 days remain", () => {
    expect(getRenewalSeverity(expiringIn(61), now)).toBeNull();
    expect(getRenewalSeverity(expiringIn(60), now)).toBeNull();
  });

  it("escalates yellow -> amber -> red at 60, 30 and 7 days", () => {
    expect(getRenewalSeverity(expiringIn(59), now)).toBe("notice");
    expect(getRenewalSeverity(expiringIn(29), now)).toBe("warning");
    expect(getRenewalSeverity(expiringIn(6), now)).toBe("critical");
  });

  it("treats an expired accreditation as critical", () => {
    expect(getRenewalSeverity(expiringIn(-1), now)).toBe("critical");
  });

  it("hides the prompt when there is no usable expiry", () => {
    expect(getRenewalSeverity(null, now)).toBeNull();
    expect(getRenewalSeverity(undefined, now)).toBeNull();
    expect(getRenewalSeverity("not-a-date", now)).toBeNull();
  });
});

describe("accreditation renewal countdown (#543)", () => {
  it("reports whole days and hours until expiry", () => {
    const expiry = new Date(now + 3 * DAY + 5 * 60 * 60 * 1000).toISOString();
    expect(getRenewalCountdown(expiry, now)).toEqual({ days: 3, hours: 5, expired: false });
  });

  it("clamps to zero once expired", () => {
    expect(getRenewalCountdown(expiringIn(-2), now)).toEqual({ days: 0, hours: 0, expired: true });
  });
});
