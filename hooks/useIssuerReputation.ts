"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIssuerReputation, type IssuerReputation } from "@/lib/api";

export function useIssuerReputation(wallet: string | null | undefined) {
  return useQuery<IssuerReputation>({
    queryKey: ["issuer-reputation", wallet],
    queryFn: () => fetchIssuerReputation(wallet as string),
    enabled: Boolean(wallet),
    staleTime: 60 * 1000,
  });
}
