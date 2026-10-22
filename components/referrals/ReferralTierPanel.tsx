"use client";

import { Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWallet } from "@/context/WalletContext";
import { useReferralTier } from "@/hooks/useReferralTier";
import {
  REFERRAL_TIER_LABELS,
  getReferralCommissionRate,
  getReferralTierProgress,
  isMaxReferralTier,
} from "@/lib/referralTier";

/**
 * Referral tier progress for the connected wallet: current tier, the
 * commission rate it unlocks, cumulative referred volume and progress toward
 * the next tier, plus a comparison of the commission rates across all tiers.
 */
export function ReferralTierPanel() {
  const { address, isConnected } = useWallet();
  const { data, isLoading, isError, refetch } = useReferralTier(address);

  if (!isConnected) {
    return (
      <Card data-testid="referral-tier-panel">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground" data-testid="referral-tier-connect">
            Connect a wallet to see your referral tier.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="referral-tier-loading">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card data-testid="referral-tier-panel">
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm text-destructive" role="alert" data-testid="referral-tier-error">
            Could not load your referral tier.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm text-primary underline"
            data-testid="referral-tier-retry"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  const progress = getReferralTierProgress(data);
  const commissionRate = getReferralCommissionRate(data);
  const tierLabel = REFERRAL_TIER_LABELS[data.tier];
  const maxTier = isMaxReferralTier(data.tier);

  return (
    <Card data-testid="referral-tier-panel">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Referral tier</CardTitle>
          <Badge variant={maxTier ? "default" : "secondary"} data-testid="referral-tier-badge">
            {tierLabel}
          </Badge>
        </div>
        <CardDescription>
          Your commission rate and progress toward the next referral tier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Commission rate</p>
              <p className="text-2xl font-semibold tabular-nums" data-testid="referral-commission-rate">
                {commissionRate}%
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cumulative referred volume</p>
            <p className="text-lg font-medium tabular-nums" data-testid="referral-cumulative-volume">
              {data.cumulative_referred_volume.toLocaleString()} XLM
            </p>
          </div>
        </div>

        {maxTier ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <p className="flex items-center gap-2 text-sm font-medium" data-testid="referral-max-tier">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              Max Tier Reached
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You have unlocked the highest referral commission rate.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to {REFERRAL_TIER_LABELS[progress.nextTier!.tier]}</span>
              <span className="tabular-nums" data-testid="referral-tier-progress-percent">
                {Math.round(progress.percent)}%
              </span>
            </div>
            <Progress
              value={progress.percent}
              aria-label={`Progress to ${REFERRAL_TIER_LABELS[progress.nextTier!.tier]}`}
              data-testid="referral-tier-progress-bar"
            />
            <p className="text-xs text-muted-foreground" data-testid="referral-tier-remaining">
              {progress.remaining.toLocaleString()} XLM more referred volume to reach{" "}
              {REFERRAL_TIER_LABELS[progress.nextTier!.tier]}
            </p>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-medium">Commission by tier</h3>
          <Table aria-label="Referral tier commission rates" data-testid="referral-tier-table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Tier</TableHead>
                <TableHead scope="col" className="text-right">
                  Volume needed
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Commission rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tiers.map((tier) => (
                <TableRow
                  key={tier.tier}
                  data-testid={`referral-tier-row-${tier.tier}`}
                  data-current={tier.tier === data.tier ? "true" : "false"}
                  className={tier.tier === data.tier ? "bg-muted/50" : undefined}
                >
                  <TableCell className="font-medium">{REFERRAL_TIER_LABELS[tier.tier]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {tier.threshold.toLocaleString()} XLM
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{tier.commission_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
