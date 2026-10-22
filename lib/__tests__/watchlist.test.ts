import { describe, it, expect } from "vitest";
import {
  detectStateChange,
  STATE_CHANGE_WINDOW_MS,
  type InvoiceStatus,
} from "../watchlist";
import type { Invoice } from "@/lib/api";

const NOW = new Date("2026-06-15T12:00:00.000Z");

function invoice(
  overrides: Partial<Invoice> = {},
): Pick<Invoice, "status" | "funded_at" | "settled_at" | "due_date" | "maturity_date"> {
  return {
    status: "open" as InvoiceStatus,
    due_date: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("detectStateChange (#474)", () => {
  it("flags an invoice funded inside the recency window as Now Funded", () => {
    const change = detectStateChange(
      invoice({
        status: "funded",
        funded_at: "2026-06-15T09:00:00.000Z",
      }),
      { now: NOW },
    );

    expect(change).toEqual(
      expect.objectContaining({ kind: "now_funded", label: "Now Funded" }),
    );
  });

  it("does not flag a funding that happened outside the recency window", () => {
    const change = detectStateChange(
      invoice({
        status: "funded",
        funded_at: "2026-05-01T09:00:00.000Z",
      }),
      { now: NOW },
    );

    expect(change).toBeNull();
  });

  it("flags an invoice whose maturity just passed as Matured", () => {
    const change = detectStateChange(
      invoice({
        status: "funded",
        due_date: "2026-06-14T12:00:00.000Z",
      }),
      { now: NOW },
    );

    expect(change).toEqual(
      expect.objectContaining({ kind: "matured", label: "Matured" }),
    );
  });

  it("does not label an expired open invoice as Matured", () => {
    const change = detectStateChange(
      invoice({
        status: "open",
        due_date: "2026-06-14T12:00:00.000Z",
      }),
      { now: NOW },
    );

    expect(change).toBeNull();
  });

  it("prefers a recent settlement over maturity", () => {
    const change = detectStateChange(
      invoice({
        status: "settled",
        due_date: "2026-06-14T12:00:00.000Z",
        settled_at: "2026-06-15T08:00:00.000Z",
      }),
      { now: NOW },
    );

    expect(change?.kind).toBe("settled");
  });

  it("uses an explicit registry transition even without invoice timestamps", () => {
    const change = detectStateChange(invoice({ status: "funded" }), {
      now: NOW,
      previousStatus: "open",
      changedAt: "2026-06-15T10:00:00.000Z",
    });

    expect(change).toEqual(
      expect.objectContaining({ kind: "now_funded", label: "Now Funded" }),
    );
  });

  it("ignores a registry transition outside the recency window", () => {
    const change = detectStateChange(invoice({ status: "funded" }), {
      now: NOW,
      previousStatus: "open",
      changedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(change).toBeNull();
  });

  it("respects a custom recency window", () => {
    const fundedAt = "2026-06-10T12:00:00.000Z"; // 5 days before NOW
    const shortWindow = 24 * 60 * 60 * 1000;

    expect(
      detectStateChange(invoice({ status: "funded", funded_at: fundedAt }), {
        now: NOW,
      })?.kind,
    ).toBe("now_funded");

    expect(
      detectStateChange(invoice({ status: "funded", funded_at: fundedAt }), {
        now: NOW,
        windowMs: shortWindow,
      }),
    ).toBeNull();

    expect(STATE_CHANGE_WINDOW_MS).toBeGreaterThan(shortWindow);
  });

  it("degrades gracefully when transition fields are missing", () => {
    expect(detectStateChange(invoice({ status: "funded" }), { now: NOW })).toBeNull();
    expect(
      detectStateChange(
        invoice({ status: "open", due_date: "" }),
        { now: NOW },
      ),
    ).toBeNull();
  });
});
