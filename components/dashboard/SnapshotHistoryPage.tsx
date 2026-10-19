"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/context/WalletContext";
import {
  useClaimAllSnapshotsMutation,
  useClaimSnapshotMutation,
  useSnapshotDistributions,
} from "@/hooks/useSnapshots";
import { totalUnclaimed, unclaimedSnapshots } from "@/lib/snapshots";
import { Money } from "@/components/currency";

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export function SnapshotHistoryPage() {
  const { address } = useWallet();
  const { data, isLoading, isError } = useSnapshotDistributions(address);
  const claimOne = useClaimSnapshotMutation(address);
  const claimAll = useClaimAllSnapshotsMutation(address);

  if (!address) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground" data-testid="snapshot-connect-wallet">
            Connect a wallet to see your snapshot distributions.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="snapshot-loading" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive" role="alert" data-testid="snapshot-error">
            Failed to load snapshot distributions. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed p-12 text-center"
        data-testid="snapshot-empty-state"
      >
        <p className="font-medium">No snapshot distributions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When an invoice you hold pays out an airdrop or bonus, it will appear here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/marketplace">Browse invoices</Link>
        </Button>
      </div>
    );
  }

  const unclaimed = unclaimedSnapshots(data);
  const busy = claimOne.isPending || claimAll.isPending;

  return (
    <div className="space-y-6" data-testid="snapshot-history-page">
      <Card data-testid="snapshot-summary">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Unclaimed</p>
            <p className="text-2xl font-bold" data-testid="snapshot-total-unclaimed">
              <Money xlm={totalUnclaimed(data)} />
            </p>
          </div>
          {unclaimed.length > 0 && (
            <Button
              onClick={() => claimAll.mutate(data)}
              disabled={busy}
              data-testid="snapshot-claim-all"
            >
              {claimAll.isPending ? "Claiming..." : `Claim all (${unclaimed.length})`}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Distribution snapshots</h2>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3" data-testid="snapshot-list">
            {data.map((snapshot) => (
              <li
                key={snapshot.id}
                data-testid={`snapshot-${snapshot.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium" data-testid={`snapshot-name-${snapshot.id}`}>
                    {snapshot.invoice_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Snapshot {formatDate(snapshot.snapshot_date)} · Total distributed{" "}
                    <Money xlm={snapshot.total_distributed} />
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {snapshot.claimed ? (
                    <div className="text-right" data-testid={`snapshot-claimed-${snapshot.id}`}>
                      <p className="text-sm font-semibold">
                        Received <Money xlm={snapshot.claimed_amount ?? snapshot.user_share} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Claimed {formatDate(snapshot.claimed_at)}
                      </p>
                    </div>
                  ) : (
                    <>
                      <span
                        className="font-semibold"
                        data-testid={`snapshot-share-${snapshot.id}`}
                      >
                        <Money xlm={snapshot.user_share} />
                      </span>
                      <Button
                        size="sm"
                        onClick={() => claimOne.mutate(snapshot.id)}
                        disabled={busy || snapshot.user_share <= 0}
                        data-testid={`snapshot-claim-${snapshot.id}`}
                      >
                        Claim
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
