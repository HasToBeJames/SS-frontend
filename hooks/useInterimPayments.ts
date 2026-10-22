"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchInterimPayments,
  type InterimPaymentsResponse,
} from "@/lib/api";

/**
 * Interim (partial) settlement payments for one invoice (#478).
 *
 * Backed by the read-only `get_interim_payments` contract query. Keyed by
 * invoice id so navigating between invoices never serves the previous
 * invoice's ledger.
 */

export const INTERIM_PAYMENTS_QUERY_KEY = ["interim-payments"] as const;

export function interimPaymentsQueryKey(invoiceId: string) {
  return ["interim-payments", invoiceId] as const;
}

export function useInterimPayments(invoiceId: string | null | undefined) {
  return useQuery<InterimPaymentsResponse>({
    queryKey: interimPaymentsQueryKey(invoiceId ?? ""),
    queryFn: () => fetchInterimPayments(invoiceId as string),
    enabled: Boolean(invoiceId),
    staleTime: 30 * 1000,
  });
}
