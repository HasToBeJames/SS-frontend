import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { InvoiceCard } from "../invoice-card";
import { renderWithCardProviders } from "./render-with-card-providers";
import type { Invoice } from "@/lib/api";

function makeInvoice(grade?: "A" | "B" | "C" | "D"): Invoice {
  return {
    id: "inv-1",
    title: "Acme receivable",
    seller: "GABC",
    amount: 1000,
    raised: 0,
    investor_count: 0,
    status: "open",
    due_date: new Date("2030-01-01T00:00:00.000Z").toISOString(),
    has_more: false,
    next_cursor: null,
    ...(grade ? { risk_rating: { tier: grade } } : {}),
  };
}

afterEach(() => localStorage.clear());

describe("InvoiceCard suitability gate (#391)", () => {
  it("locks a grade-D invoice for a moderate investor and names the required tier", () => {
    localStorage.setItem("ss-suitability-tier", "moderate");
    renderWithCardProviders(<InvoiceCard invoice={makeInvoice("D")} />);
    expect(screen.getByRole("button", { name: "Locked" })).toBeDisabled();
    expect(screen.getByTestId("suitability-lock")).toHaveTextContent("Requires risk profile: Aggressive or higher");
  });

  it("allows a grade-C invoice for a moderate investor", () => {
    localStorage.setItem("ss-suitability-tier", "moderate");
    renderWithCardProviders(<InvoiceCard invoice={makeInvoice("C")} />);
    expect(screen.getByRole("button", { name: "Invest" })).toBeEnabled();
    expect(screen.queryByTestId("suitability-lock")).toBeNull();
  });

  it("never gates unrated invoices", () => {
    renderWithCardProviders(<InvoiceCard invoice={makeInvoice()} />);
    expect(screen.getByRole("button", { name: "Invest" })).toBeEnabled();
  });
});
