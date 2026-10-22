import { describe, it, expect } from "vitest";
import {
  ALERT_EVENTS,
  DEFAULT_ALERT_PREFERENCES,
  buildMaturityReminderPreview,
  normalizeAlertPreferences,
  normalizeMaturityReminderDays,
  toggleMaturityReminderDay,
} from "../alertPreferences";

describe("alert preferences (#531)", () => {
  it("covers the five event types", () => {
    expect(ALERT_EVENTS.map((e) => e.key)).toEqual([
      "settlement",
      "kyc_expiry",
      "watchlist_change",
      "auto_invest",
      "maturity_approaching",
    ]);
  });

  it("defaults to all enabled for wallets with no saved preferences", () => {
    expect(normalizeAlertPreferences(null)).toEqual(DEFAULT_ALERT_PREFERENCES);
    expect(Object.values(normalizeAlertPreferences(undefined)).every(Boolean)).toBe(true);
  });

  it("keeps saved values and fills missing keys with enabled", () => {
    const result = normalizeAlertPreferences({ settlement: false, auto_invest: false });
    expect(result).toEqual({
      settlement: false,
      kyc_expiry: true,
      watchlist_change: true,
      auto_invest: false,
      maturity_approaching: true,
    });
  });
});

describe("maturity reminders (#542)", () => {
  it("defaults to every interval and drops unknown values", () => {
    expect(normalizeMaturityReminderDays(undefined)).toEqual([30, 14, 7, 1]);
    expect(normalizeMaturityReminderDays([7, 3, 30, "1"])).toEqual([30, 7]);
  });

  it("toggles an interval and keeps longest lead time first", () => {
    expect(toggleMaturityReminderDay([30, 7], 14)).toEqual([30, 14, 7]);
    expect(toggleMaturityReminderDay([30, 14, 7], 14)).toEqual([30, 7]);
  });

  it("previews only the enabled reminders still ahead, sorted by maturity", () => {
    const now = new Date("2026-09-10T00:00:00Z");
    const preview = buildMaturityReminderPreview(
      [
        { invoice_id: "late", title: "Late", amount: 10, due_date: "2026-10-20T00:00:00Z", days_remaining: 19 },
        { invoice_id: "soon", title: "Soon", amount: 5, due_date: "2026-10-05T00:00:00Z", days_remaining: 4 },
      ],
      [30, 7],
      now,
    );

    expect(preview.map((item) => item.invoiceId)).toEqual(["soon", "late"]);
    expect(preview[0].upcoming.map((schedule) => schedule.days)).toEqual([7]);
    expect(preview[1].upcoming.map((schedule) => schedule.days)).toEqual([30, 7]);
  });

  it("returns an empty preview when there are no holdings", () => {
    expect(buildMaturityReminderPreview([], [30, 14, 7, 1])).toEqual([]);
  });
});

