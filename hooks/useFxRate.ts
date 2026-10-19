"use client";

import { useQuery } from "@tanstack/react-query";
import { BASE_CURRENCY, fetchFxRate, type InvestCurrency } from "@/lib/investCurrency";

export const FX_RATE_REFETCH_INTERVAL = 30 * 1000;

export function useFxRate(currency: InvestCurrency) {
  return useQuery({
    queryKey: ["fx-rate", currency],
    queryFn: ({ signal }) => fetchFxRate(currency, signal),
    enabled: currency !== BASE_CURRENCY,
    refetchInterval: FX_RATE_REFETCH_INTERVAL,
  });
}
