"use client";

import { Award, PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useInvestorLoyalty } from "@/hooks/useInvestorLoyalty";
import { useWallet } from "@/context/WalletContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LOYALTY_TIER_LABELS, getLoyaltyProgress, isRecentlyPromoted } from "@/lib/loyalty";

export function LoyaltyTierPage() {
  usePageTitle("Loyalty tier");
  const { address, isConnected } = useWallet();
  const { data: loyalty, isLoading, isError } = useInvestorLoyalty(address);

  if (!isConnected) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="loyalty-connect">
        Connect a wallet to see your loyalty tier.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="loyalty-loading">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !loyalty) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Could not load your loyalty tier. Refresh to try again.
      </p>
    );
  }

  const progress = getLoyaltyProgress(loyalty);
  const tierLabel = LOYALTY_TIER_LABELS[loyalty.tier];
  const showBanner = isRecentlyPromoted(loyalty.promoted_at);

  return (
    <div className="space-y-6" data-testid="loyalty-page">
      <h1 className="text-2xl font-bold">Loyalty tier</h1>

      {showBanner && (
        <div
          className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
          role="status"
          data-testid="tier-upgrade-banner"
        >
          <PartyPopper className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            You reached {tierLabel}. Your new benefits are active.
          </p>
        </div>
      )}

      <Card data-testid="current-tier-card">
        <CardContent className="flex items-center gap-4 pt-6">
          <Award className="h-10 w-10 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">Current tier</p>
            <p className="text-2xl font-semibold" data-testid="current-tier-name">
              {tierLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              Cumulative volume:{" "}
              <span className="font-medium text-foreground" data-testid="cumulative-volume">
                {loyalty.cumulative_volume.toLocaleString()} XLM
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-6">
          {progress.nextTier ? (
            <>
              <div className="flex justify-between text-sm">
                <span>Progress to {LOYALTY_TIER_LABELS[progress.nextTier.tier]}</span>
                <span className="tabular-nums" data-testid="tier-progress-percent">
                  {Math.round(progress.percent)}%
                </span>
              </div>
              <Progress
                value={progress.percent}
                aria-label={`Progress to ${LOYALTY_TIER_LABELS[progress.nextTier.tier]}`}
                data-testid="tier-progress-bar"
              />
              <p className="text-xs text-muted-foreground" data-testid="tier-remaining">
                {progress.remaining.toLocaleString()} XLM more to reach{" "}
                {LOYALTY_TIER_LABELS[progress.nextTier.tier]}
              </p>
            </>
          ) : (
            <p className="font-medium" data-testid="max-tier-reached">
              Max Tier Reached
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Benefits by tier</h2>
        </CardHeader>
        <CardContent>
          <Table data-testid="tier-benefits-table">
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Volume needed</TableHead>
                <TableHead className="text-right">Fee discount</TableHead>
                <TableHead className="text-right">Yield boost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loyalty.tiers.map((tier) => (
                <TableRow
                  key={tier.tier}
                  data-testid={`tier-row-${tier.tier}`}
                  data-current={tier.tier === loyalty.tier ? "true" : "false"}
                  className={tier.tier === loyalty.tier ? "bg-muted/50" : undefined}
                >
                  <TableCell className="font-medium">{LOYALTY_TIER_LABELS[tier.tier]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {tier.threshold.toLocaleString()} XLM
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{tier.fee_discount}%</TableCell>
                  <TableCell className="text-right tabular-nums">{tier.yield_boost}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
