"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchInvoiceDetail,
  fetchWatchlistRegistry,
  watchInvoiceOnRegistry,
  unwatchInvoiceOnRegistry,
  type Invoice,
  type InvoiceDetail,
  type WatchlistRegistryResponse,
} from "@/lib/api";
import { detectStateChange, type WatchlistStateChange } from "@/lib/watchlist";
import { useStellarWallet } from "./useStellarWallet";

/**
 * Investor watchlist (#474).
 *
 * The on-chain registry is the source of truth. This hook reads it for the
 * connected wallet, hydrates each watched id into a full `Invoice` for the
 * cards, and layers optimistic add/remove mutations on top — the bell flips
 * immediately and rolls back if the registry call fails.
 */

export const WATCHLIST_QUERY_KEY = ["watchlist"] as const;

export function watchlistQueryKey(address: string | null) {
  return ["watchlist", address] as const;
}

export function watchlistInvoicesQueryKey(
  address: string | null,
  ids: readonly string[],
) {
  // Sorted so the key is stable regardless of the order the registry returned
  // its entries in.
  return ["watchlist-invoices", address, [...ids].sort().join(",")] as const;
}

export interface WatchedInvoice {
  invoice: Invoice;
  /** Recent transition to surface as a badge, or `null` when nothing changed. */
  stateChange: WatchlistStateChange | null;
}

export interface UseWatchlistResult {
  entries: WatchlistRegistryResponse["items"];
  invoices: WatchedInvoice[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  isConnected: boolean;
  isWatched: (invoiceId: string) => boolean;
  isPending: (invoiceId?: string) => boolean;
  refetch: () => void;
  toggle: (invoiceId: string) => void;
  add: (invoiceId: string) => void;
  remove: (invoiceId: string) => void;
}

export function useWatchlist(): UseWatchlistResult {
  const { address, isConnected } = useStellarWallet();
  const queryClient = useQueryClient();
  const registryKey = watchlistQueryKey(address);

  const registryQuery = useQuery({
    queryKey: registryKey,
    queryFn: () => fetchWatchlistRegistry(address as string),
    // Without a wallet there is no registry row to read; the page shows a
    // connect prompt instead.
    enabled: isConnected && Boolean(address),
    staleTime: 30_000,
  });

  const entries = useMemo(
    () => registryQuery.data?.items ?? [],
    [registryQuery.data],
  );
  const watchedIds = useMemo(
    () => entries.map((entry) => entry.invoice_id),
    [entries],
  );

  const invoicesQuery = useQuery({
    queryKey: watchlistInvoicesQueryKey(address, watchedIds),
    queryFn: async () => {
      const results = await Promise.all(
        watchedIds.map(async (id) => {
          try {
            return await fetchInvoiceDetail(id);
          } catch {
            // A registry entry can outlive a deleted invoice; skip it rather
            // than failing the whole watchlist.
            return null;
          }
        }),
      );
      return results.filter((invoice): invoice is InvoiceDetail => invoice !== null);
    },
    enabled: isConnected && watchedIds.length > 0,
    staleTime: 30_000,
  });

  const invoices = useMemo<WatchedInvoice[]>(() => {
    const entryById = new Map(entries.map((entry) => [entry.invoice_id, entry]));
    return (invoicesQuery.data ?? []).map((invoice) => {
      const entry = entryById.get(invoice.id);
      return {
        invoice,
        stateChange: detectStateChange(invoice, {
          previousStatus: entry?.last_seen_status ?? null,
          changedAt: entry?.last_state_change_at ?? null,
        }),
      };
    });
  }, [entries, invoicesQuery.data]);

  const addMutation = useMutation({
    mutationFn: (invoiceId: string) => {
      if (!address) throw new Error("Connect a wallet to watch invoices");
      return watchInvoiceOnRegistry(address, invoiceId);
    },
    onMutate: async (invoiceId) => {
      await queryClient.cancelQueries({ queryKey: registryKey });
      const previous =
        queryClient.getQueryData<WatchlistRegistryResponse>(registryKey) ?? {
          items: [],
        };

      queryClient.setQueryData<WatchlistRegistryResponse>(registryKey, (old) => {
        const items = old?.items ?? [];
        if (items.some((item) => item.invoice_id === invoiceId)) {
          return old ?? { items };
        }
        return {
          items: [
            { invoice_id: invoiceId, added_at: new Date().toISOString() },
            ...items,
          ],
        };
      });

      return { previous };
    },
    onError: (_error, _invoiceId, context) => {
      // Revert to the snapshot taken before the optimistic write so a rejected
      // registry call does not leave a phantom watch behind.
      if (context?.previous) {
        queryClient.setQueryData(registryKey, context.previous);
      } else {
        queryClient.invalidateQueries({ queryKey: registryKey });
      }
      toast.error("Couldn't add to watchlist. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: registryKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (invoiceId: string) => {
      if (!address) throw new Error("Connect a wallet to watch invoices");
      return unwatchInvoiceOnRegistry(address, invoiceId);
    },
    onMutate: async (invoiceId) => {
      await queryClient.cancelQueries({ queryKey: registryKey });
      const previous =
        queryClient.getQueryData<WatchlistRegistryResponse>(registryKey) ?? {
          items: [],
        };

      queryClient.setQueryData<WatchlistRegistryResponse>(registryKey, (old) => ({
        items: (old?.items ?? []).filter(
          (item) => item.invoice_id !== invoiceId,
        ),
      }));

      return { previous };
    },
    onError: (_error, _invoiceId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(registryKey, context.previous);
      } else {
        queryClient.invalidateQueries({ queryKey: registryKey });
      }
      toast.error("Couldn't remove from watchlist. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: registryKey });
    },
  });

  const watchedSet = useMemo(() => new Set(watchedIds), [watchedIds]);

  const pendingIds = useMemo(() => {
    const ids = new Set<string>();
    if (addMutation.isPending && typeof addMutation.variables === "string") {
      ids.add(addMutation.variables);
    }
    if (
      removeMutation.isPending &&
      typeof removeMutation.variables === "string"
    ) {
      ids.add(removeMutation.variables);
    }
    return ids;
  }, [
    addMutation.isPending,
    addMutation.variables,
    removeMutation.isPending,
    removeMutation.variables,
  ]);

  const isWatched = useCallback(
    (invoiceId: string) => watchedSet.has(invoiceId),
    [watchedSet],
  );

  const isPending = useCallback(
    (invoiceId?: string) =>
      invoiceId ? pendingIds.has(invoiceId) : pendingIds.size > 0,
    [pendingIds],
  );

  const toggle = useCallback(
    (invoiceId: string) => {
      if (watchedSet.has(invoiceId)) {
        removeMutation.mutate(invoiceId);
      } else {
        addMutation.mutate(invoiceId);
      }
    },
    [addMutation, removeMutation, watchedSet],
  );

  return {
    entries,
    invoices,
    count: watchedIds.length,
    isLoading: registryQuery.isLoading || invoicesQuery.isLoading,
    isError: registryQuery.isError,
    isConnected,
    isWatched,
    isPending,
    refetch: () => {
      void registryQuery.refetch();
    },
    toggle,
    add: addMutation.mutate,
    remove: removeMutation.mutate,
  };
}
