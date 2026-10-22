import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { WatchlistButton } from "../WatchlistButton";
import * as api from "@/lib/api";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), loading: vi.fn() },
}));

const walletState = vi.hoisted(() => ({
  address: "GADDRESSWATCHLIST" as string | null,
  isConnected: true,
}));

vi.mock("@/hooks/useStellarWallet", () => ({
  useStellarWallet: () => walletState,
}));

/**
 * Backs the registry calls with an in-memory set so a refetch after a mutation
 * observes the new state, the way the real registry would.
 */
function mockRegistry(initial: string[] = []) {
  const watched = new Set(initial);
  vi.spyOn(api, "fetchWatchlistRegistry").mockImplementation(async () => ({
    items: [...watched].map((invoice_id) => ({
      invoice_id,
      added_at: new Date().toISOString(),
    })),
  }));
  vi.spyOn(api, "fetchInvoiceDetail").mockImplementation(async (id) =>
    makeInvoice({ id }),
  );
  vi.spyOn(api, "watchInvoiceOnRegistry").mockImplementation(
    async (_address, invoiceId) => {
      watched.add(invoiceId);
      return { success: true };
    },
  );
  vi.spyOn(api, "unwatchInvoiceOnRegistry").mockImplementation(
    async (_address, invoiceId) => {
      watched.delete(invoiceId);
      return { success: true };
    },
  );
  return watched;
}

function renderButton(invoiceId = "inv-1") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WatchlistButton invoiceId={invoiceId} />
    </QueryClientProvider>,
  );
}

function makeInvoice(overrides: Partial<api.InvoiceDetail> = {}): api.InvoiceDetail {
  return {
    id: "inv-1",
    title: "Acme receivable",
    seller: "GABC",
    amount: 1000,
    raised: 0,
    investor_count: 0,
    status: "open",
    due_date: "2030-01-01T00:00:00.000Z",
    has_more: false,
    next_cursor: null,
    description: "A test receivable",
    investors: [],
    document_url: "https://example.com/doc.pdf",
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  walletState.address = "GADDRESSWATCHLIST";
  walletState.isConnected = true;
});

describe("WatchlistButton (#474)", () => {
  it("shows an unwatched bell and submits a watch call on click", async () => {
    mockRegistry([]);
    const watchSpy = vi.mocked(api.watchInvoiceOnRegistry);

    renderButton();
    const button = await screen.findByRole("button", {
      name: "Add to watchlist",
    });
    expect(button).toHaveAttribute("data-watched", "false");

    await userEvent.click(button);

    expect(watchSpy).toHaveBeenCalledWith("GADDRESSWATCHLIST", "inv-1");
    expect(
      await screen.findByRole("button", { name: "Remove from watchlist" }),
    ).toHaveAttribute("data-watched", "true");
  });

  it("shows a ringing bell for a watched invoice and submits an unwatch call", async () => {
    mockRegistry(["inv-1"]);
    const unwatchSpy = vi.mocked(api.unwatchInvoiceOnRegistry);

    renderButton();
    const button = await screen.findByRole("button", {
      name: "Remove from watchlist",
    });
    expect(button).toHaveAttribute("data-watched", "true");

    await userEvent.click(button);

    expect(unwatchSpy).toHaveBeenCalledWith("GADDRESSWATCHLIST", "inv-1");
    expect(
      await screen.findByRole("button", { name: "Add to watchlist" }),
    ).toHaveAttribute("data-watched", "false");
  });

  it("disables the bell and explains why when no wallet is connected", async () => {
    walletState.address = null;
    walletState.isConnected = false;
    mockRegistry([]);

    renderButton();
    const button = await screen.findByRole("button", {
      name: "Add to watchlist",
    });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "title",
      "Connect your wallet to watch invoices",
    );
  });
});
