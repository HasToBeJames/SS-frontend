import { cloneElement } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderBookDepthChart } from "@/components/marketplace/OrderBookDepthChart";
import { ORDER_BOOK_POLL_INTERVAL_MS } from "@/hooks/useInvoiceOrderBook";

vi.mock("@/lib/api", () => ({ fetchInvoiceOrderBook: vi.fn() }));
vi.mock("recharts", async (orig) => {
  const actual = await orig<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      cloneElement(children, { width: 400, height: 300 } as object),
  };
});

import { fetchInvoiceOrderBook } from "@/lib/api";

function renderChart() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OrderBookDepthChart invoiceId="inv-1" />
    </QueryClientProvider>,
  );
}

describe("OrderBookDepthChart", () => {
  beforeEach(() => vi.clearAllMocks());

  it("polls every 30 seconds", () => {
    expect(ORDER_BOOK_POLL_INTERVAL_MS).toBe(30_000);
  });

  it("renders chart and mid-price from the API", async () => {
    vi.mocked(fetchInvoiceOrderBook).mockResolvedValue({
      bids: [{ price: 0.9, quantity: 10 }],
      asks: [{ price: 1.1, quantity: 5 }],
    });
    renderChart();
    expect(await screen.findByTestId("orderbook-chart")).toBeInTheDocument();
    expect(screen.getByTestId("orderbook-mid-price")).toHaveTextContent("Mid 1 XLM");
    expect(fetchInvoiceOrderBook).toHaveBeenCalledWith("inv-1", expect.anything());
  });

  it("shows an empty state", async () => {
    vi.mocked(fetchInvoiceOrderBook).mockResolvedValue({ bids: [], asks: [] });
    renderChart();
    await waitFor(() => expect(screen.getByTestId("orderbook-empty")).toBeInTheDocument());
  });

  it("shows an error state", async () => {
    vi.mocked(fetchInvoiceOrderBook).mockRejectedValue(new Error("boom"));
    renderChart();
    await waitFor(() => expect(screen.getByTestId("orderbook-error")).toBeInTheDocument());
  });
});
