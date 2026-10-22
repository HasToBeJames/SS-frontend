import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useWatchlist } from "../useWatchlist";
import * as api from "@/lib/api";
import { toast } from "sonner";

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

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
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
    due_date: new Date("2030-01-01T00:00:00.000Z").toISOString(),
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useWatchlist registry sync (#474)", () => {
  it("reads the connected wallet's registry and hydrates watched invoices", async () => {
    const queryClient = makeQueryClient();
    const fetchSpy = vi
      .spyOn(api, "fetchWatchlistRegistry")
      .mockResolvedValue({
        items: [
          {
            invoice_id: "inv-1",
            added_at: new Date().toISOString(),
          },
        ],
      });
    vi.spyOn(api, "fetchInvoiceDetail").mockResolvedValue(makeInvoice());

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.count).toBe(1));

    expect(fetchSpy).toHaveBeenCalledWith("GADDRESSWATCHLIST");
    expect(result.current.isWatched("inv-1")).toBe(true);
    expect(result.current.invoices).toHaveLength(1);
    expect(result.current.invoices[0].invoice.title).toBe("Acme receivable");
  });

  it("attaches a recent state-change badge derived from the registry transition", async () => {
    const queryClient = makeQueryClient();
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
      makeInvoice({ status: "funded" }),
    );

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() =>
      expect(result.current.invoices[0]?.stateChange?.kind).toBe("now_funded"),
    );
    expect(result.current.invoices[0].stateChange?.label).toBe("Now Funded");
  });

  it("does not fetch the registry or invoices when no wallet is connected", async () => {
    walletState.address = null;
    walletState.isConnected = false;

    const queryClient = makeQueryClient();
    const fetchSpy = vi.spyOn(api, "fetchWatchlistRegistry");
    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.count).toBe(0);
  });
});

describe("useWatchlist optimistic mutations (#474)", () => {
  it("adds an invoice optimistically before the registry call resolves", async () => {
    const queryClient = makeQueryClient();
    vi.spyOn(api, "fetchWatchlistRegistry").mockResolvedValue({ items: [] });
    vi.spyOn(api, "fetchInvoiceDetail").mockResolvedValue(makeInvoice());

    let resolveWatch!: (value: { success: boolean }) => void;
    const watchPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveWatch = resolve;
    });
    vi.spyOn(api, "watchInvoiceOnRegistry").mockReturnValue(watchPromise);

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggle("inv-1");
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<api.WatchlistRegistryResponse>([
        "watchlist",
        "GADDRESSWATCHLIST",
      ]);
      expect(cached?.items.map((item) => item.invoice_id)).toContain("inv-1");
    });
    expect(result.current.isWatched("inv-1")).toBe(true);

    await act(async () => {
      resolveWatch({ success: true });
    });
  });

  it("reverts the optimistic add and toasts when the registry call fails", async () => {
    const queryClient = makeQueryClient();
    vi.spyOn(api, "fetchWatchlistRegistry").mockResolvedValue({ items: [] });
    vi.spyOn(api, "fetchInvoiceDetail").mockResolvedValue(makeInvoice());

    let rejectWatch!: (error: Error) => void;
    const watchPromise = new Promise<{ success: boolean }>((_resolve, reject) => {
      rejectWatch = reject;
    });
    vi.spyOn(api, "watchInvoiceOnRegistry").mockReturnValue(watchPromise);

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.toggle("inv-1");
    });

    await waitFor(() => expect(result.current.isWatched("inv-1")).toBe(true));

    await act(async () => {
      rejectWatch(new Error("contract call failed"));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't add to watchlist. Please try again.",
      );
      expect(result.current.isWatched("inv-1")).toBe(false);
    });

    const cached = queryClient.getQueryData<api.WatchlistRegistryResponse>([
      "watchlist",
      "GADDRESSWATCHLIST",
    ]);
    expect(cached?.items).toHaveLength(0);
  });

  it("removes an invoice optimistically and reverts when the call fails", async () => {
    const queryClient = makeQueryClient();
    vi.spyOn(api, "fetchWatchlistRegistry").mockResolvedValue({
      items: [{ invoice_id: "inv-1", added_at: new Date().toISOString() }],
    });
    vi.spyOn(api, "fetchInvoiceDetail").mockResolvedValue(makeInvoice());

    let rejectUnwatch!: (error: Error) => void;
    const unwatchPromise = new Promise<{ success: boolean }>((_resolve, reject) => {
      rejectUnwatch = reject;
    });
    vi.spyOn(api, "unwatchInvoiceOnRegistry").mockReturnValue(unwatchPromise);

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isWatched("inv-1")).toBe(true));

    act(() => {
      result.current.toggle("inv-1");
    });

    await waitFor(() => expect(result.current.isWatched("inv-1")).toBe(false));

    await act(async () => {
      rejectUnwatch(new Error("contract call failed"));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't remove from watchlist. Please try again.",
      );
      expect(result.current.isWatched("inv-1")).toBe(true);
    });
  });
});
