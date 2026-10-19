"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  claimAllYieldTranches,
  claimYieldTranche,
  fetchYieldVesting,
  type InvoiceYieldVesting,
} from "@/lib/api";

export const YIELD_VESTING_QUERY_KEY = ["yield-vesting"] as const;

export function useYieldVesting(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: [...YIELD_VESTING_QUERY_KEY, walletAddress],
    queryFn: () => fetchYieldVesting(walletAddress!),
    enabled: Boolean(walletAddress),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useClaimYieldTrancheMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trancheId: string) => claimYieldTranche(trancheId),
    onSuccess: (result, trancheId) => {
      void queryClient.invalidateQueries({ queryKey: YIELD_VESTING_QUERY_KEY });
      toast.success(
        `Claimed ${result.claimed_amount.toLocaleString()} XLM`,
        result.transaction_hash
          ? { description: result.transaction_hash }
          : undefined
      );
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to claim tranche");
    },
  });
}

export function useClaimAllYieldTrancheMutation(walletAddress: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => claimAllYieldTranches(walletAddress ?? ""),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: YIELD_VESTING_QUERY_KEY });
      toast.success(`Claimed ${result.claimed_amount.toLocaleString()} XLM total`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to claim tranches");
    },
  });
}

/**
 * Returns all tranches across all invoice vestings that are currently
 * claimable (release timestamp is in the past and not yet claimed).
 */
export function getClaimableTranches(schedules: InvoiceYieldVesting[], now = Date.now()) {
  return schedules.flatMap((s) =>
    s.tranches.filter(
      (t) => !t.claimed && new Date(t.release_timestamp).getTime() <= now
    )
  );
}
