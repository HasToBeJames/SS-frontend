"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelLimitOrder,
  fetchActiveLimitOrders,
  placeLimitOrder,
  type PlaceLimitOrderInput,
} from "@/lib/api";

export const LIMIT_ORDERS_QUERY_KEY = ["limit-orders"] as const;

export function limitOrdersQueryKey(walletAddress: string) {
  return [...LIMIT_ORDERS_QUERY_KEY, walletAddress] as const;
}

export function useLimitOrders(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: [...LIMIT_ORDERS_QUERY_KEY, walletAddress],
    queryFn: () => fetchActiveLimitOrders(walletAddress!),
    enabled: Boolean(walletAddress),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function usePlaceLimitOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlaceLimitOrderInput) => placeLimitOrder(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: LIMIT_ORDERS_QUERY_KEY });
      toast.success(
        `Limit order placed for ${input.fraction_amount} fractions at max ${input.max_price_per_fraction} XLM/fraction`
      );
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to place limit order");
    },
  });
}

export function useCancelLimitOrderMutation(walletAddress: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => cancelLimitOrder(orderId),
    onMutate: async (orderId) => {
      // Optimistic removal — remove from the cached list immediately.
      await queryClient.cancelQueries({
        queryKey: [...LIMIT_ORDERS_QUERY_KEY, walletAddress],
      });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchActiveLimitOrders>>>(
        [...LIMIT_ORDERS_QUERY_KEY, walletAddress]
      );
      queryClient.setQueryData(
        [...LIMIT_ORDERS_QUERY_KEY, walletAddress],
        (old: typeof previous) => (old ? old.filter((o) => o.id !== orderId) : old)
      );
      return { previous };
    },
    onError: (_err, _orderId, context) => {
      // Roll back on error.
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          [...LIMIT_ORDERS_QUERY_KEY, walletAddress],
          context.previous
        );
      }
      toast.error("Failed to cancel order");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LIMIT_ORDERS_QUERY_KEY });
    },
    onSuccess: () => {
      toast.success("Order cancelled");
    },
  });
}
