import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavChip } from "../NavChip";
import { InvoiceCard } from "../invoice-card";
import { renderWithCardProviders } from "./render-with-card-providers";
import * as api from "@/lib/api";
import type { Invoice } from "@/lib/api";

function navPayload(overrides: Partial<api.InvoiceNav> = {}): api.InvoiceNav {
  return {
    invoice_id: "inv-1",
    nav_per_fraction: 1,
    current_price: 1,
    computed_at: new Date().toISOString(),
    ...overrides,
  };
}

function renderChip(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("NavChip (#546)", () => {
  it("rates a price below the NAV as below, with the discount colour", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1, current_price: 0.9 })
    );
    renderChip(<NavChip invoiceId="inv-1" />);

    const chip = await screen.findByTestId("nav-chip");
    expect(chip).toHaveTextContent("Below NAV");
    expect(chip).toHaveAttribute("data-position", "below");
    expect(chip).toHaveClass("bg-green-100");
  });

  it("rates a price above the NAV as above, with the premium colour", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1, current_price: 1.1 })
    );
    renderChip(<NavChip invoiceId="inv-1" />);

    const chip = await screen.findByTestId("nav-chip");
    expect(chip).toHaveTextContent("Above NAV");
    expect(chip).toHaveAttribute("data-position", "above");
    expect(chip).toHaveClass("bg-amber-100");
  });

  it("rates a price level with the NAV as at NAV", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1, current_price: 1 })
    );
    renderChip(<NavChip invoiceId="inv-1" />);

    const chip = await screen.findByTestId("nav-chip");
    expect(chip).toHaveTextContent("At NAV");
    expect(chip).toHaveAttribute("data-position", "at");
  });

  it("shows the NAV, the price and the gap in the tooltip", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1.0234, current_price: 0.98 })
    );
    renderChip(<NavChip invoiceId="inv-1" />);

    await userEvent.hover(await screen.findByTestId("nav-chip"));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("NAV per fraction: 1.0234 XLM");
    expect(tooltip).toHaveTextContent("Current price: 0.98 XLM");
    expect(tooltip).toHaveTextContent("vs NAV: -424 bps discount");
  });

  it("falls back to the invoice price when the API reports no market price", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1, current_price: null })
    );
    renderChip(<NavChip invoiceId="inv-1" fractionPrice={0.95} />);

    const chip = await screen.findByTestId("nav-chip");
    expect(chip).toHaveAttribute("data-position", "below");
  });

  it("warns when the NAV is more than an hour old", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({
        nav_per_fraction: 1,
        current_price: 0.9,
        computed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      })
    );
    renderChip(<NavChip invoiceId="inv-1" />);

    await userEvent.hover(await screen.findByTestId("nav-chip"));
    expect(await screen.findByTestId("nav-chip-stale")).toBeInTheDocument();
  });

  it("renders nothing when the invoice has no NAV", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(null);
    renderChip(<NavChip invoiceId="inv-1" />);

    await vi.waitFor(() => {
      expect(api.fetchInvoiceNav).toHaveBeenCalled();
    });
    expect(screen.queryByTestId("nav-chip")).not.toBeInTheDocument();
  });

  it("appears on the grid InvoiceCard", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1, current_price: 0.9 })
    );
    const invoice: Invoice = {
      id: "inv-1",
      title: "Acme",
      seller: "G",
      amount: 1000,
      raised: 0,
      investor_count: 0,
      status: "open",
      due_date: new Date("2030-01-01").toISOString(),
      fraction_price: 0.9,
      has_more: false,
      next_cursor: null,
    };
    renderWithCardProviders(<InvoiceCard invoice={invoice} />);

    expect(await screen.findByTestId("nav-chip")).toHaveTextContent("Below NAV");
  });
});
