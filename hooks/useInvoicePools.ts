"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchInvoicePool, fetchInvoicePools, investInPool } from "@/lib/api";
import { PORTFOLIO_QUERY_KEY } from "./usePortfolio";

export const POOLS_QUERY_KEY = ["pools"] as const;

export function useInvoicePools() {
  return useQuery({ queryKey: POOLS_QUERY_KEY, queryFn: fetchInvoicePools });
}

export function useInvoicePool(poolId: string) {
  return useQuery({
    queryKey: [...POOLS_QUERY_KEY, poolId],
    queryFn: () => fetchInvoicePool(poolId),
    enabled: Boolean(poolId),
  });
}

export function useInvestPoolMutation(poolId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, wallet }: { amount: number; wallet: string }) =>
      investInPool(poolId, amount, wallet),
    onSuccess: (_data, { amount }) => {
      toast.success(`PoolInvestmentExecuted: ${amount.toLocaleString()} XLM invested`);
      queryClient.invalidateQueries({ queryKey: POOLS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
    },
    onError: () => {
      toast.error("Pool investment failed");
    },
  });
}
