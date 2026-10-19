"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInvestorLoyalty } from "@/lib/api";

export function useInvestorLoyalty(wallet: string | null) {
  return useQuery({
    queryKey: ["investor", wallet, "loyalty"],
    queryFn: () => fetchInvestorLoyalty(wallet as string),
    enabled: Boolean(wallet),
  });
}
