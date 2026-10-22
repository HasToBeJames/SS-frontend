import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InvoiceNavPanel } from "../InvoiceNavPanel";
import * as api from "@/lib/api";

function navPayload(overrides: Partial<api.InvoiceNav> = {}): api.InvoiceNav {
  return {
    invoice_id: "inv-1",
    nav_per_fraction: 1,
    current_price: 1,
    computed_at: new Date().toISOString(),
    ...overrides,
  };
}

function renderPanel(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("InvoiceNavPanel (#546)", () => {
  it("shows the NAV, the current price and the premium in basis points", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1.0234, current_price: 0.98 })
    );
    renderPanel(<InvoiceNavPanel invoiceId="inv-1" />);

    expect(await screen.findByTestId("invoice-nav-panel")).toBeInTheDocument();
    expect(screen.getByTestId("nav-panel-nav")).toHaveTextContent("1.0234 XLM");
    expect(screen.getByTestId("nav-panel-price")).toHaveTextContent("0.98 XLM");
    expect(screen.getByTestId("nav-panel-bps")).toHaveTextContent("-424 bps discount");
  });

  it("phrases a price above the NAV as a premium", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1, current_price: 1.05 })
    );
    renderPanel(<InvoiceNavPanel invoiceId="inv-1" />);

    expect(await screen.findByTestId("nav-panel-bps")).toHaveTextContent("+500 bps premium");
  });

  it("warns when the NAV is stale", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({
        nav_per_fraction: 1,
        current_price: 0.9,
        computed_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      })
    );
    renderPanel(<InvoiceNavPanel invoiceId="inv-1" />);

    expect(await screen.findByTestId("nav-panel-stale")).toBeInTheDocument();
  });

  it("renders nothing when the invoice has no NAV", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(null);
    renderPanel(<InvoiceNavPanel invoiceId="inv-1" />);

    await vi.waitFor(() => {
      expect(api.fetchInvoiceNav).toHaveBeenCalled();
    });
    expect(screen.queryByTestId("invoice-nav-panel")).not.toBeInTheDocument();
  });

  it("falls back to the invoice price when the API reports no market price", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(
      navPayload({ nav_per_fraction: 1, current_price: null })
    );
    renderPanel(<InvoiceNavPanel invoiceId="inv-1" fractionPrice={0.95} />);

    expect(await screen.findByTestId("nav-panel-price")).toHaveTextContent("0.95 XLM");
  });
});
