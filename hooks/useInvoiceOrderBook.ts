"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInvoiceOrderBook } from "@/lib/api";

export const ORDER_BOOK_POLL_INTERVAL_MS = 30 * 1000;

export const INVOICE_ORDER_BOOK_QUERY_KEY = ["invoice-orderbook"] as const;

export function useInvoiceOrderBook(invoiceId: string | null | undefined) {
  return useQuery({
    queryKey: [...INVOICE_ORDER_BOOK_QUERY_KEY, invoiceId],
    queryFn: ({ signal }) => fetchInvoiceOrderBook(invoiceId as string, signal),
    enabled: Boolean(invoiceId),
    refetchInterval: ORDER_BOOK_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });
}
