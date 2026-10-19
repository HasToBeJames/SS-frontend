import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BuyFractionModal } from "../BuyFractionModal";
import * as api from "@/lib/api";
import type { ResaleListing } from "@/lib/api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const listing = {
  id: "l1",
  invoice_title: "Invoice A",
  ask_price: 10,
  remaining_quantity: 5,
} as unknown as ResaleListing;

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BuyFractionModal listing={listing} open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("BuyFractionModal transfer restriction", () => {
  it("replaces the buy button when blocked and restores it after retry succeeds", async () => {
    const spy = vi
      .spyOn(api, "fetchTransferRestriction")
      .mockResolvedValueOnce({ allowed: false, restriction: "kyc_required" })
      .mockResolvedValue({ allowed: true, restriction: null });

    renderModal();
    expect(await screen.findByTestId("transfer-blocked")).toBeInTheDocument();
    expect(screen.queryByTestId("buy-confirm-btn")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("transfer-blocked-retry"));
    await waitFor(() => expect(screen.getByTestId("buy-confirm-btn")).toBeInTheDocument());
    expect(screen.queryByTestId("transfer-blocked")).not.toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("shows the normal buy button when allowed", async () => {
    vi.spyOn(api, "fetchTransferRestriction").mockResolvedValue({
      allowed: true,
      restriction: null,
    });
    renderModal();
    expect(await screen.findByTestId("buy-confirm-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("transfer-blocked")).not.toBeInTheDocument();
  });
});
