"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInvoiceEvents } from "@/lib/maturity";

export function useInvoiceEvents(invoiceId: string, enabled = true) {
  return useQuery({
    queryKey: ["invoice", invoiceId, "events"],
    queryFn: ({ signal }) => fetchInvoiceEvents(invoiceId, signal),
    enabled,
  });
}
