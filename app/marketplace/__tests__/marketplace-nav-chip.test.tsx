import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";
import React from "react";
import MarketplacePage from "../page";
import * as api from "@/lib/api";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useInfiniteQuery: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/marketplace",
}));

const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const invoice = {
  id: "inv-1",
  title: "Acme receivable",
  seller: "seller",
  amount: 10000,
  raised: 5000,
  investor_count: 3,
  status: "open",
  due_date: "2027-01-01T00:00:00.000Z",
  fraction_price: 0.9,
  has_more: false,
  next_cursor: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseInfiniteQuery.mockReturnValue({
    data: { pages: [{ invoices: [invoice], has_more: false, next_cursor: null }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isFetching: false,
  } as any);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Marketplace list view - NAV chip (#546)", () => {
  it("shows the NAV position on the list row", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue({
      invoice_id: "inv-1",
      nav_per_fraction: 1,
      current_price: 0.9,
      computed_at: new Date().toISOString(),
    });

    render(<MarketplacePage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId("invoice-row-inv-1")).toBeInTheDocument();
    const chip = await screen.findByTestId("nav-chip");
    expect(chip).toHaveTextContent("Below NAV");
    expect(screen.getByTestId("invoice-row-inv-1")).toContainElement(chip);
  });

  it("hides the chip for an invoice with no NAV", async () => {
    vi.spyOn(api, "fetchInvoiceNav").mockResolvedValue(null);

    render(<MarketplacePage />, { wrapper: createWrapper() });

    await screen.findByTestId("invoice-row-inv-1");
    await vi.waitFor(() => {
      expect(api.fetchInvoiceNav).toHaveBeenCalled();
    });
    expect(screen.queryByTestId("nav-chip")).not.toBeInTheDocument();
  });
});
