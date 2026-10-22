"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInvoiceNav, type InvoiceNav } from "@/lib/api";

/** NAV refresh cadence (#546). */
export const NAV_POLL_INTERVAL_MS = 60_000;

/**
 * The computed NAV of one invoice (#546).
 *
 * Polling is suspended while the tab is hidden: an investor looking at a
 * marketplace tab they have switched away from is not watching these numbers,
 * and a background interval per card is a lot of requests for nothing.
 *
 * Invoices the backend has no NAV for stop being polled altogether — the
 * first answer says there is nothing to show, and asking again every minute
 * for the rest of the session would be pure noise.
 */
export function useInvoiceNav(invoiceId: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  return useQuery<InvoiceNav | null>({
    queryKey: ["invoice", invoiceId, "nav"],
    queryFn: () => fetchInvoiceNav(invoiceId),
    enabled: enabled && Boolean(invoiceId),
    staleTime: NAV_POLL_INTERVAL_MS,
    refetchInterval: (query) => {
      if (query.state.data === null) return false;
      if (typeof document !== "undefined" && document.hidden) return false;
      return NAV_POLL_INTERVAL_MS;
    },
    // Keep the last good value through each refetch, so the chip does not
    // unmount and remount every minute.
    placeholderData: (previous) => previous,
  });
}
