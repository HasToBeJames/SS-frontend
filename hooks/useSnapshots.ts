"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  claimSnapshot,
  fetchSnapshotDistributions,
  unclaimedSnapshots,
  type SnapshotDistribution,
} from "@/lib/snapshots";

export const snapshotsQueryKey = (wallet: string | null) =>
  ["investor", "snapshots", wallet] as const;

export function useSnapshotDistributions(wallet: string | null) {
  return useQuery({
    queryKey: snapshotsQueryKey(wallet),
    queryFn: ({ signal }) => fetchSnapshotDistributions(wallet as string, signal),
    enabled: Boolean(wallet),
  });
}

export function useClaimSnapshotMutation(wallet: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snapshotId: string) => claimSnapshot(snapshotId, wallet as string),
    onSuccess: () => {
      toast.success("Snapshot distribution claimed");
      void queryClient.invalidateQueries({ queryKey: snapshotsQueryKey(wallet) });
    },
    onError: () => {
      toast.error("Snapshot claim failed");
    },
  });
}

/** Claims every unclaimed snapshot one after another, stopping at the first failure. */
export function useClaimAllSnapshotsMutation(wallet: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshots: SnapshotDistribution[]) => {
      const pending = unclaimedSnapshots(snapshots);
      let claimed = 0;
      try {
        for (const snapshot of pending) {
          await claimSnapshot(snapshot.id, wallet as string);
          claimed += 1;
        }
      } catch {
        throw new Error(`Claimed ${claimed} of ${pending.length} snapshots before an error`);
      }
      return claimed;
    },
    onSuccess: (claimed) => {
      toast.success(`Claimed ${claimed} snapshot${claimed === 1 ? "" : "s"}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: snapshotsQueryKey(wallet) });
    },
  });
}
