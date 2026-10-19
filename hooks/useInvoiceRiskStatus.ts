"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInvoiceRiskStatus } from "@/lib/api";

export const invoiceRiskStatusQueryKey = (invoiceId: string) =>
  ["invoice", invoiceId, "risk-status"] as const;

export function useInvoiceRiskStatus(invoiceId: string, enabled = true) {
  return useQuery({
    queryKey: invoiceRiskStatusQueryKey(invoiceId),
    queryFn: () => fetchInvoiceRiskStatus(invoiceId),
    enabled: enabled && Boolean(invoiceId),
    refetchInterval: 60_000,
  });
}
