"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInvoiceLeaderboard, type InvoiceLeaderboardMetric } from "@/lib/api";

export function useInvoiceLeaderboard(metric: InvoiceLeaderboardMetric) {
  return useQuery({
    queryKey: ["invoice-leaderboard", metric],
    queryFn: () => fetchInvoiceLeaderboard(metric),
    staleTime: 60 * 1000,
  });
}
