import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  autoInvestEventsQueryKey,
  autoInvestRuleQueryKey,
  useAutoInvest,
} from "../useAutoInvest";
import * as api from "@/lib/api";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), loading: vi.fn() },
}));

const walletState = vi.hoisted(() => ({
  address: "GINVESTOR1" as string | null,
  isConnected: true,
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => walletState,
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
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function ruleResponse(
  overrides: Partial<api.AutoInvestRulePayload> = {},
): api.AutoInvestRuleResponse {
  return {
    address: "GINVESTOR1",
    rule: {
      sectors: ["trade_finance"],
      min_yield: 6,
      max_invoice_age_days: 30,
      max_amount_per_invoice: 1500,
      is_enabled: true,
      updated_at: "2026-10-01T00:00:00.000Z",
      ...overrides,
    },
  };
}

function executedEvent(): api.AutoInvestExecutedEvent {
  return {
    id: "evt-1",
    invoice_id: "inv-1",
    invoice_title: "Acme receivable",
    amount: 500,
    yield_percentage: 8.5,
    sector: "trade_finance",
    executed_at: "2026-10-15T14:30:00.000Z",
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  walletState.address = "GINVESTOR1";
  walletState.isConnected = true;
});

describe("useAutoInvest (#476)", () => {
  it("reads the rule and executed events for the connected wallet", async () => {
    vi.spyOn(api, "fetchAutoInvestRule").mockResolvedValue(ruleResponse());
    vi.spyOn(api, "fetchAutoInvestExecutedEvents").mockResolvedValue([
      executedEvent(),
    ]);

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useAutoInvest(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.rule).not.toBeNull());

    expect(result.current.rule?.sectors).toEqual(["trade_finance"]);
    expect(result.current.rule?.isEnabled).toBe(true);
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].invoice_title).toBe("Acme receivable");
  });

  it("does not fetch when no wallet is connected", async () => {
    walletState.address = null;
    walletState.isConnected = false;
    const ruleSpy = vi.spyOn(api, "fetchAutoInvestRule");
    const eventSpy = vi.spyOn(api, "fetchAutoInvestExecutedEvents");

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useAutoInvest(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(ruleSpy).not.toHaveBeenCalled();
    expect(eventSpy).not.toHaveBeenCalled();
  });

  it("saves the rule optimistically before the contract call resolves", async () => {
    vi.spyOn(api, "fetchAutoInvestRule").mockResolvedValue(ruleResponse());
    vi.spyOn(api, "fetchAutoInvestExecutedEvents").mockResolvedValue([]);

    let resolveSave!: (value: api.SetAutoInvestRuleResult) => void;
    const savePromise = new Promise<api.SetAutoInvestRuleResult>((resolve) => {
      resolveSave = resolve;
    });
    const setSpy = vi
      .spyOn(api, "setAutoInvestRule")
      .mockReturnValue(savePromise);

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useAutoInvest(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.rule).not.toBeNull());

    act(() => {
      result.current.save.mutate({
        sectors: ["energy"],
        minYield: 9,
        maxInvoiceAgeDays: 14,
        maxAmountPerInvoice: 800,
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<api.AutoInvestRuleResponse>(
        autoInvestRuleQueryKey("GINVESTOR1"),
      );
      expect(cached?.rule?.sectors).toEqual(["energy"]);
      expect(cached?.rule?.min_yield).toBe(9);
      expect(cached?.rule?.is_enabled).toBe(true);
    });
    expect(setSpy).toHaveBeenCalledWith(
      "GINVESTOR1",
      expect.objectContaining({
        sectors: ["energy"],
        min_yield: 9,
        is_enabled: true,
      }),
    );

    await act(async () => {
      resolveSave({ success: true });
    });
  });

  it("reverts the optimistic save when the contract call fails", async () => {
    vi.spyOn(api, "fetchAutoInvestRule").mockResolvedValue(ruleResponse());
    vi.spyOn(api, "fetchAutoInvestExecutedEvents").mockResolvedValue([]);

    let rejectSave!: (error: Error) => void;
    const savePromise = new Promise<api.SetAutoInvestRuleResult>(
      (_resolve, reject) => {
        rejectSave = reject;
      },
    );
    vi.spyOn(api, "setAutoInvestRule").mockReturnValue(savePromise);

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useAutoInvest(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.rule).not.toBeNull());

    act(() => {
      result.current.save.mutate({
        sectors: ["energy"],
        minYield: 9,
        maxInvoiceAgeDays: 14,
        maxAmountPerInvoice: 800,
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<api.AutoInvestRuleResponse>(
        autoInvestRuleQueryKey("GINVESTOR1"),
      );
      expect(cached?.rule?.sectors).toEqual(["energy"]);
    });

    await act(async () => {
      rejectSave(new Error("contract call failed"));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't save your auto-invest rule. Please try again.",
      );
      const cached = queryClient.getQueryData<api.AutoInvestRuleResponse>(
        autoInvestRuleQueryKey("GINVESTOR1"),
      );
      expect(cached?.rule?.sectors).toEqual(["trade_finance"]);
    });
  });

  it("disables optimistically and rolls back on failure", async () => {
    vi.spyOn(api, "fetchAutoInvestRule").mockResolvedValue(ruleResponse());
    vi.spyOn(api, "fetchAutoInvestExecutedEvents").mockResolvedValue([]);

    let rejectDisable!: (error: Error) => void;
    const disablePromise = new Promise<{ success: boolean }>(
      (_resolve, reject) => {
        rejectDisable = reject;
      },
    );
    vi.spyOn(api, "disableAutoInvest").mockReturnValue(disablePromise);

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useAutoInvest(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.rule?.isEnabled).toBe(true));

    act(() => {
      result.current.disable.mutate();
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<api.AutoInvestRuleResponse>(
        autoInvestRuleQueryKey("GINVESTOR1"),
      );
      expect(cached?.rule?.is_enabled).toBe(false);
    });

    await act(async () => {
      rejectDisable(new Error("contract call failed"));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't disable auto-invest. Please try again.",
      );
      const cached = queryClient.getQueryData<api.AutoInvestRuleResponse>(
        autoInvestRuleQueryKey("GINVESTOR1"),
      );
      expect(cached?.rule?.is_enabled).toBe(true);
    });

    expect(
      queryClient.getQueryData(autoInvestEventsQueryKey("GINVESTOR1")),
    ).toEqual([]);
  });
});
