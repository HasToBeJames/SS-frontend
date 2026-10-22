import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  interimPaymentsQueryKey,
  useInterimPayments,
} from "../useInterimPayments";
import * as api from "@/lib/api";

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

const RESPONSE: api.InterimPaymentsResponse = {
  invoice_id: "inv-1",
  total_due: 10_000,
  payments: [
    { id: "p1", amount: 2_000, paid_at: "2026-01-05T00:00:00.000Z" },
    {
      id: "p2",
      amount: 8_000,
      paid_at: "2026-02-05T00:00:00.000Z",
      is_final: true,
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useInterimPayments (#478)", () => {
  it("fetches the interim payments for the given invoice", async () => {
    const fetchSpy = vi
      .spyOn(api, "fetchInterimPayments")
      .mockResolvedValue(RESPONSE);

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useInterimPayments("inv-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.data).toEqual(RESPONSE));
    expect(fetchSpy).toHaveBeenCalledWith("inv-1");
    expect(
      queryClient.getQueryData(interimPaymentsQueryKey("inv-1")),
    ).toEqual(RESPONSE);
  });

  it("stays idle when there is no invoice id", async () => {
    const fetchSpy = vi.spyOn(api, "fetchInterimPayments");

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useInterimPayments(null), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it("surfaces a failed contract query as an error", async () => {
    vi.spyOn(api, "fetchInterimPayments").mockRejectedValue(
      new Error("contract unavailable"),
    );

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useInterimPayments("inv-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
