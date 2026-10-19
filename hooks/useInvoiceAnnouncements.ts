"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchInvoiceAnnouncements } from "@/lib/api";
import { fetchIpfsText } from "@/lib/ipfs";

export const announcementsQueryKey = (invoiceId: string) =>
  ["invoice", invoiceId, "announcements"] as const;

export function useInvoiceAnnouncements(invoiceId: string) {
  return useInfiniteQuery({
    queryKey: announcementsQueryKey(invoiceId),
    queryFn: ({ pageParam }) =>
      fetchInvoiceAnnouncements(invoiceId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
    enabled: Boolean(invoiceId),
  });
}

/** Loads the full announcement body, only once the entry is expanded. */
export function useAnnouncementContent(contentHash: string, enabled: boolean) {
  return useQuery({
    queryKey: ["announcement-content", contentHash],
    queryFn: () => fetchIpfsText(contentHash),
    enabled: enabled && Boolean(contentHash),
    staleTime: Infinity,
    retry: false,
  });
}
