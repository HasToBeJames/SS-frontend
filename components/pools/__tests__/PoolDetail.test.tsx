import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PoolDetail } from "../PoolDetail";
import type { InvoicePool } from "@/lib/api";

const mockPool = vi.fn();
const mockInvest = vi.fn();

vi.mock("@/hooks/useInvoicePools", () => ({
  useInvoicePool: () => mockPool(),
  useInvestPoolMutation: () => ({ mutate: mockInvest, isPending: false }),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: "GINV", isConnected: true }),
}));

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));

const pool: InvoicePool = {
  id: "pool-1",
  name: "Diversified basket",
  tvl: 250000,
  invoices: [
    { invoice_id: "a", name: "Acme", sector: "sme", weight: 50, yield_percentage: 10 },
    { invoice_id: "b", name: "Beta", sector: "real_estate", weight: 30, yield_percentage: 8 },
    { invoice_id: "c", name: "Gamma", sector: "trade_finance", weight: 20, yield_percentage: 5 },
  ],
};

describe("PoolDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPool.mockReturnValue({ data: pool, isLoading: false, isError: false });
  });

  it("renders each invoice with sector, weight and yield", () => {
    render(<PoolDetail poolId="pool-1" />);
    const row = screen.getByTestId("pool-row-a");
    expect(row).toHaveTextContent("Acme");
    expect(row).toHaveTextContent("sme");
    expect(row).toHaveTextContent("50%");
    expect(row).toHaveTextContent("10%");
  });

  it("computes the weighted average yield and shows TVL", () => {
    render(<PoolDetail poolId="pool-1" />);
    expect(screen.getByTestId("pool-weighted-yield")).toHaveTextContent("8.40%");
    expect(screen.getByTestId("pool-tvl")).toHaveTextContent("250,000 XLM");
  });

  it("previews the pro-rata allocation per invoice", () => {
    render(<PoolDetail poolId="pool-1" />);
    fireEvent.change(screen.getByTestId("pool-amount-input"), { target: { value: "1000" } });

    expect(screen.getByTestId("pool-allocation-a")).toHaveTextContent("500.00 XLM");
    expect(screen.getByTestId("pool-allocation-b")).toHaveTextContent("300.00 XLM");
    expect(screen.getByTestId("pool-allocation-c")).toHaveTextContent("200.00 XLM");
  });

  it("submits the pool investment for the entered amount", () => {
    render(<PoolDetail poolId="pool-1" />);
    fireEvent.change(screen.getByTestId("pool-amount-input"), { target: { value: "1000" } });
    fireEvent.click(screen.getByTestId("pool-invest-submit"));

    expect(mockInvest).toHaveBeenCalledWith({ amount: 1000, wallet: "GINV" }, expect.any(Object));
  });

  it("shows a not-found state for an unknown pool", () => {
    mockPool.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<PoolDetail poolId="missing" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Pool not found");
  });
});
