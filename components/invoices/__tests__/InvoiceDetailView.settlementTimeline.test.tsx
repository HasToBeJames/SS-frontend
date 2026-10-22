import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { InvoiceDetailView } from "../InvoiceDetailView";
import { useInvoiceStatusPolling } from "@/hooks/useInvoiceStatusPolling";
import { useProtocolStatus } from "@/hooks/useProtocolStatus";
import { useInterimPayments } from "@/hooks/useInterimPayments";

// Integration coverage for the #478 placement: the repayment timeline belongs
// on the detail page once an invoice is funded, and not on an open one.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/invoices/inv-1",
}));
vi.mock("@/hooks/useInvoiceStatusPolling", () => ({
  useInvoiceStatusPolling: vi.fn(),
}));
vi.mock("@/hooks/useProtocolStatus", () => ({
  useProtocolStatus: vi.fn().mockReturnValue({ data: undefined }),
}));
vi.mock("@/context/WalletContext", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/context/WalletContext")>();
  return { ...actual, useWallet: vi.fn().mockReturnValue({ address: null }) };
});
vi.mock("@/hooks/useKycStatus", () => ({
  useIsKycApproved: vi.fn().mockReturnValue({
    isApproved: false,
    isLoading: false,
    status: undefined,
  }),
  useKycStatus: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
}));
vi.mock("@/hooks/useInterimPayments", () => ({
  useInterimPayments: vi.fn().mockReturnValue({
    data: { invoice_id: "inv-1", total_due: 10_000, payments: [] },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock("@/components/invoices/InvoiceRatingWidget", () => ({
  InvoiceRatingWidget: () => null,
}));
vi.mock("@/components/marketplace/InvestorDemandMetrics", () => ({
  InvestorDemandMetrics: () => null,
}));
vi.mock("@/components/invoices/ReturnsBreakdown", () => ({
  ReturnsBreakdown: () => null,
}));

function makeInvoice(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "inv-1",
    title: "Test Invoice",
    seller: "seller-address",
    description: "A test invoice",
    amount: 10_000,
    raised: 10_000,
    investor_count: 3,
    status: "funded",
    due_date: new Date(Date.now() + 86_400_000).toISOString(),
    document_url: "ipfs://doc",
    investors: [],
    has_more: false,
    next_cursor: null,
    ...overrides,
  };
}

function renderView(invoice: ReturnType<typeof makeInvoice>) {
  vi.mocked(useInvoiceStatusPolling).mockReturnValue({
    data: invoice,
    isLoading: false,
    isError: false,
    isFetching: false,
  } as never);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <InvoiceDetailView invoiceId={invoice.id as string} />
    </QueryClientProvider>,
  );
}

describe("InvoiceDetailView settlement timeline placement (#478)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the repayment timeline below the financials for a funded invoice", () => {
    renderView(makeInvoice({ status: "funded" }));

    expect(screen.getByTestId("settlement-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("settlement-timeline-empty")).toBeInTheDocument();
  });

  it("shows the timeline for a settled invoice", () => {
    renderView(makeInvoice({ status: "settled", settled_at: new Date().toISOString() }));

    expect(screen.getByTestId("settlement-timeline")).toBeInTheDocument();
  });

  it("does not show a repayment timeline for an invoice still open for funding", () => {
    renderView(makeInvoice({ status: "open", raised: 1_000 }));

    expect(screen.queryByTestId("settlement-timeline")).not.toBeInTheDocument();
    expect(useInterimPayments).not.toHaveBeenCalled();
  });
});
