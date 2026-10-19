/**
 * Distribution snapshots (issue #495).
 *
 * An airdrop or bonus is distributed against a snapshot of holders taken at a
 * point in time. Each holder claims their share with the contract's
 * `distribute_from_snapshot` call.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface SnapshotDistribution {
  id: string;
  invoice_id: string;
  invoice_name: string;
  snapshot_date: string;
  total_distributed: number;
  user_share: number;
  claimed: boolean;
  /** Amount actually received; present once claimed. */
  claimed_amount?: number | null;
  claimed_at?: string | null;
  tx_hash?: string | null;
}

export function unclaimedSnapshots(snapshots: SnapshotDistribution[]): SnapshotDistribution[] {
  return snapshots.filter((s) => !s.claimed && s.user_share > 0);
}

export function totalUnclaimed(snapshots: SnapshotDistribution[]): number {
  return unclaimedSnapshots(snapshots).reduce((sum, s) => sum + s.user_share, 0);
}

export async function fetchSnapshotDistributions(
  wallet: string,
  signal?: AbortSignal
): Promise<SnapshotDistribution[]> {
  const res = await fetch(
    `${API_BASE}/investor/snapshots?wallet=${encodeURIComponent(wallet)}`,
    { signal }
  );
  if (!res.ok) throw new Error("Failed to fetch snapshot distributions");
  const data = (await res.json()) as
    | { snapshots?: SnapshotDistribution[] }
    | SnapshotDistribution[];
  return Array.isArray(data) ? data : (data.snapshots ?? []);
}

/** Calls `distribute_from_snapshot` for a single snapshot. */
export async function claimSnapshot(
  snapshotId: string,
  wallet: string
): Promise<{ success: boolean; tx_hash?: string }> {
  const res = await fetch(
    `${API_BASE}/investor/snapshots/${encodeURIComponent(snapshotId)}/claim`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet }),
    }
  );
  if (!res.ok) throw new Error("Snapshot claim failed");
  return res.json();
}
