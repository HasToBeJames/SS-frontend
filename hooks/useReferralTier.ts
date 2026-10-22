"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReferralTier } from "@/lib/api";

export const REFERRAL_TIER_QUERY_KEY = ["referral", "tier"] as const;

export function useReferralTier(wallet: string | null) {
  return useQuery({
    queryKey: [...REFERRAL_TIER_QUERY_KEY, wallet],
    queryFn: () => fetchReferralTier(wallet as string),
    enabled: Boolean(wallet),
  });
}
