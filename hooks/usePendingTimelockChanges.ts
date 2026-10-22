"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPendingTimelockChanges } from "@/lib/api";

export const PENDING_TIMELOCK_QUERY_KEY = ["governance", "timelock", "pending"] as const;

export function usePendingTimelockChanges() {
  return useQuery({
    queryKey: PENDING_TIMELOCK_QUERY_KEY,
    queryFn: fetchPendingTimelockChanges,
    staleTime: 60 * 1000,
    retry: false,
  });
}
