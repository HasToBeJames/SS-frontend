"use client";

/**
 * Yield Vesting Schedule Viewer (#479)
 *
 * Shows investors their scheduled yield tranches for settled invoices.
 * Claimable tranches are highlighted and a Claim button is enabled after
 * the release timestamp. A "Claim All" button claims every unlocked tranche
 * across all invoices in a single transaction.
 */

import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  getClaimableTranches,
  useClaimAllYieldTrancheMutation,
  useClaimYieldTrancheMutation,
  useYieldVesting,
} from "@/hooks/useYieldVesting";
import type { YieldTranche } from "@/lib/api";

function formatAmount(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Countdown string for a future release — "Xd Yh" or just the date. */
function nextReleaseCountdown(releaseIso: string, now = Date.now()): string {
  const ms = new Date(releaseIso).getTime() - now;
  if (ms <= 0) return "Released";
  const totalHours = Math.ceil(ms / (1000 * 60 * 60));
  if (totalHours < 24) return `${totalHours}h`;
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

interface TrancheRowProps {
  tranche: YieldTranche;
  onClaim: (trancheId: string) => void;
  isClaiming: boolean;
  now: number;
}

function TrancheRow({ tranche, onClaim, isClaiming, now }: TrancheRowProps) {
  const releaseMs = new Date(tranche.release_timestamp).getTime();
  const isReleased = releaseMs <= now;
  const isClaimable = isReleased && !tranche.claimed;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
        isClaimable
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
          : tranche.claimed
          ? "border-transparent bg-muted/40 opacity-60"
          : "border-border"
      }`}
      data-testid={`tranche-row-${tranche.id}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          Tranche {tranche.tranche_index + 1} of {tranche.total_tranches}
        </p>
        <p className="text-xs text-muted-foreground">
          Release: {formatDate(tranche.release_timestamp)}
          {!isReleased && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {nextReleaseCountdown(tranche.release_timestamp, now)}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="text-sm font-semibold"
          data-testid={`tranche-amount-${tranche.id}`}
        >
          {formatAmount(tranche.amount)} XLM
        </span>

        {tranche.claimed ? (
          <Badge
            variant="secondary"
            className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
            data-testid={`tranche-claimed-${tranche.id}`}
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Claimed
          </Badge>
        ) : (
          <Button
            type="button"
            size="sm"
            variant={isClaimable ? "default" : "outline"}
            disabled={!isClaimable || isClaiming}
            onClick={() => onClaim(tranche.id)}
            data-testid={`claim-tranche-${tranche.id}`}
            aria-label={`Claim ${formatAmount(tranche.amount)} XLM from tranche ${tranche.tranche_index + 1}`}
          >
            {isClaiming && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden="true" />
            )}
            {isClaimable ? "Claim" : "Locked"}
          </Button>
        )}
      </div>
    </div>
  );
}

interface YieldVestingSectionProps {
  walletAddress: string | null | undefined;
}

export function YieldVestingSection({ walletAddress }: YieldVestingSectionProps) {
  const now = Date.now();
  const { data: schedules, isLoading } = useYieldVesting(walletAddress);
  const claimMutation = useClaimYieldTrancheMutation();
  const claimAllMutation = useClaimAllYieldTrancheMutation(walletAddress);

  if (!walletAddress) return null;

  if (isLoading) {
    return (
      <section aria-labelledby="yield-vesting-heading" data-testid="yield-vesting-loading">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 pt-6">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!schedules || schedules.length === 0) return null;

  const claimableTranches = getClaimableTranches(schedules, now);
  const hasClaimable = claimableTranches.length > 0;

  return (
    <section
      className="space-y-4"
      aria-labelledby="yield-vesting-heading"
      data-testid="yield-vesting-section"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="yield-vesting-heading" className="text-lg font-semibold">
          Yield Vesting
        </h2>
        {hasClaimable && (
          <Button
            type="button"
            size="sm"
            disabled={claimAllMutation.isPending}
            onClick={() => claimAllMutation.mutate()}
            data-testid="claim-all-tranches"
          >
            {claimAllMutation.isPending && (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Claim All ({claimableTranches.length})
          </Button>
        )}
      </div>

      {schedules.map((schedule) => {
        const totalClaimed = schedule.tranches.filter((t) => t.claimed).length;
        const totalTranches = schedule.tranches.length;
        const unclaimedYield = schedule.total_yield - schedule.claimed_yield;

        return (
          <Card key={schedule.invoice_id} data-testid={`vesting-card-${schedule.invoice_id}`}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold" data-testid={`vesting-title-${schedule.invoice_id}`}>
                    {schedule.invoice_title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {totalClaimed} of {totalTranches} tranches claimed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total yield</p>
                  <p className="font-semibold" data-testid={`vesting-total-${schedule.invoice_id}`}>
                    {formatAmount(schedule.total_yield)} XLM
                  </p>
                  {unclaimedYield > 0 && (
                    <p
                      className="text-xs text-green-700 dark:text-green-400"
                      data-testid={`vesting-unclaimed-${schedule.invoice_id}`}
                    >
                      {formatAmount(unclaimedYield)} XLM unclaimed
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {schedule.tranches.map((tranche) => (
                <TrancheRow
                  key={tranche.id}
                  tranche={tranche}
                  now={now}
                  onClaim={(id) => claimMutation.mutate(id)}
                  isClaiming={
                    claimMutation.isPending && claimMutation.variables === tranche.id
                  }
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
