"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInvoiceBenchmark } from "@/lib/api";

export function useInvoiceBenchmark(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice", invoiceId, "benchmark"],
    queryFn: () => fetchInvoiceBenchmark(invoiceId),
    enabled: Boolean(invoiceId),
  });
}
