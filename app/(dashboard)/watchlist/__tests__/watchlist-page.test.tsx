import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import WatchlistPage from "../page";
import * as api from "@/lib/api";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), loading: vi.fn() },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/watchlist",
  useSearchParams: () => new URLSearchParams(),
}));

const walletState = vi.hoisted(() => ({
  address: "GADDRESSWATCHLIST" as string | null,
  isConnected: true,
}));

vi.mock("@/hooks/useStellarWallet", () => ({
  useStellarWallet: () => walletState,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<WatchlistPage />, { wrapper: Wrapper });
}

function makeInvoice(overrides: Partial<api.InvoiceDetail> = {}): api.InvoiceDetail {
  return {
    id: "inv-1",
    title: "Acme receivable",
    seller: "GABC",
    amount: 1000,
    raised: 250,
    investor_count: 2,
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

describe("WatchlistPage (#474)", () => {
  it("renders the empty state with a marketplace CTA when nothing is watched", async () => {
    vi.spyOn(api, "fetchWatchlistRegistry").mockResolvedValue({ items: [] });

    renderPage();

    expect(await screen.findByTestId("watchlist-empty-state")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Browse Marketplace/i }),
    ).toHaveAttribute("href", "/marketplace");
  });

  it("lists watched invoices as cards with state-change badges", async () => {
    vi.spyOn(api, "fetchWatchlistRegistry").mockResolvedValue({
      items: [
        {
          invoice_id: "inv-1",
          added_at: new Date().toISOString(),
          last_seen_status: "open",
          last_state_change_at: new Date().toISOString(),
        },
      ],
    });
    vi.spyOn(api, "fetchInvoiceDetail").mockResolvedValue(
      makeInvoice({ status: "funded", funded_at: new Date().toISOString() }),
    );

    renderPage();

    expect(await screen.findByTestId("invoice-card-inv-1")).toBeInTheDocument();
    const badge = screen.getByTestId("state-change-badge");
    expect(badge).toHaveAttribute("data-change-kind", "now_funded");
    expect(badge).toHaveTextContent("Now Funded");
  });

  it("prompts to connect a wallet when disconnected", async () => {
    walletState.address = null;
    walletState.isConnected = false;
    const fetchSpy = vi.spyOn(api, "fetchWatchlistRegistry");

    renderPage();

    expect(
      await screen.findByTestId("watchlist-connect-wallet"),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
