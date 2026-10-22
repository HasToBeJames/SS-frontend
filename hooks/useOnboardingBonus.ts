"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOnboardingBonus, type OnboardingBonus } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

export const ONBOARDING_BONUS_QUERY_KEY = ["onboarding-bonus"] as const;

/** Onboarding bonus status for the connected wallet (#529); idle when disconnected. */
export function useOnboardingBonus() {
  const { address, isConnected } = useWallet();

  return useQuery<OnboardingBonus | null>({
    queryKey: [...ONBOARDING_BONUS_QUERY_KEY, address],
    queryFn: () => fetchOnboardingBonus(address as string),
    enabled: isConnected && Boolean(address),
    staleTime: 30 * 1000,
  });
}
