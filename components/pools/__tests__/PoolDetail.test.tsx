import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PoolDetail } from "../PoolDetail";
import type { InvoicePool } from "@/lib/api";

const mockPool = vi.fn();
const mockInvest = vi.fn();
const mockSubscription = vi.fn();
const mockCreateSubscription = vi.fn();
const mockCancelSubscription = vi.fn();

vi.mock("@/hooks/useInvoicePools", () => ({
  useInvoicePool: () => mockPool(),
  useInvestPoolMutation: () => ({ mutate: mockInvest, isPending: false }),
}));

vi.mock("@/hooks/usePoolSubscription", () => ({
  usePoolSubscription: () => mockSubscription(),
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
    mockSubscription.mockReturnValue({
      subscription: null,
      isLoading: false,
      isError: false,
      isConnected: true,
      create: { mutate: mockCreateSubscription, isPending: false },
      cancel: { mutate: mockCancelSubscription, isPending: false },
    });
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

  it("sets up a recurring subscription from the Subscribe tab (#544)", async () => {
    render(<PoolDetail poolId="pool-1" />);
    await userEvent.click(screen.getByTestId("pool-subscribe-tab"));

    await userEvent.click(screen.getByTestId("pool-subscription-interval-weekly"));
    await userEvent.type(screen.getByTestId("pool-subscription-amount-input"), "100");
    expect(screen.getByTestId("pool-subscription-preview-annual")).toHaveTextContent("5,200 XLM");

    await userEvent.click(screen.getByTestId("pool-subscription-submit"));
    expect(mockCreateSubscription).toHaveBeenCalledWith(
      { amount: 100, interval: "weekly" },
      expect.any(Object),
    );
  });

  it("shows the active subscription with a cancel action (#544)", async () => {
    mockSubscription.mockReturnValue({
      subscription: {
        id: "sub-1",
        pool_id: "pool-1",
        amount: 50,
        interval: "monthly",
        next_execution_at: "2026-11-01T00:00:00Z",
        total_invested: 150,
        is_active: true,
      },
      isLoading: false,
      isError: false,
      isConnected: true,
      create: { mutate: mockCreateSubscription, isPending: false },
      cancel: { mutate: mockCancelSubscription, isPending: false },
    });
    render(<PoolDetail poolId="pool-1" />);
    await userEvent.click(screen.getByTestId("pool-subscribe-tab"));

    expect(screen.getByTestId("pool-subscription-config")).toHaveTextContent("50 XLM · Monthly");
    expect(screen.getByTestId("pool-subscription-total")).toHaveTextContent("150 XLM");
    await userEvent.click(screen.getByTestId("pool-subscription-cancel"));
    expect(mockCancelSubscription).toHaveBeenCalled();
  });
});
