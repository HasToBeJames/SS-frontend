"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTransferRestriction } from "@/lib/api";

export function useTransferRestriction(listingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["secondary-market", "transfer-check", listingId],
    queryFn: () => fetchTransferRestriction(listingId as string),
    enabled: enabled && Boolean(listingId),
    staleTime: 0,
    retry: false,
  });
}
