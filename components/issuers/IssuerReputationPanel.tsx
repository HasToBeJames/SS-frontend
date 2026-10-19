"use client";

import { Award, ShieldQuestion, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIssuerReputation } from "@/hooks/useIssuerReputation";
import {
  REPUTATION_TIERS,
  formatReputationEvent,
  getReputationTier,
  sortReputationHistory,
} from "@/lib/reputation";
import { cn } from "@/lib/utils";

export function IssuerReputationSkeleton() {
  return (
    <Card data-testid="issuer-reputation-loading">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-28" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

function formatEventDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ReputationBadge({ score }: { score: number | null }) {
  const tier = getReputationTier(score);
  const Icon = tier.id === "unrated" ? ShieldQuestion : Award;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-testid="reputation-badge"
          data-tier={tier.id}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            tier.className,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span data-testid="reputation-tier-name">{tier.label}</span>
          {score !== null && (
            <span className="tabular-nums" data-testid="reputation-score">
              {Math.round(score)}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs" data-testid="reputation-tier-tooltip">
        <p className="mb-1 font-medium">Reputation tiers</p>
        <ul className="space-y-0.5">
          {REPUTATION_TIERS.map((t) => (
            <li key={t.id} data-testid={`tier-threshold-${t.id}`}>
              {t.label}: {t.min}–{t.max}
            </li>
          ))}
          <li>Unrated: no settlement history yet</li>
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

/** Badge for the profile header; shares the panel's cached query. */
export function IssuerReputationHeaderBadge({ wallet }: { wallet: string }) {
  const { data, isLoading, isError } = useIssuerReputation(wallet);
  if (isLoading) {
    return <Skeleton className="h-9 w-32 rounded-full" data-testid="reputation-badge-loading" />;
  }
  if (isError || !data) return null;
  return <ReputationBadge score={data.score} />;
}

export function IssuerReputationPanel({ wallet }: { wallet: string }) {
  const { data, isLoading, isError } = useIssuerReputation(wallet);

  if (isLoading) return <IssuerReputationSkeleton />;

  if (isError || !data) {
    return (
      <Card data-testid="issuer-reputation-error">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Reputation data is unavailable right now.
        </CardContent>
      </Card>
    );
  }

  const history = sortReputationHistory(data.history);

  return (
    <Card data-testid="issuer-reputation">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Score history</h2>
        </div>
        {data.score === null && (
          <p className="text-sm text-muted-foreground" data-testid="reputation-unrated-note">
            This issuer has no settled invoices yet, so no score is available.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="reputation-history-empty">
            No score changes recorded.
          </p>
        ) : (
          <ol className="divide-y" data-testid="reputation-history">
            {history.map((event) => {
              const positive = event.score_delta >= 0;
              const DeltaIcon = positive ? TrendingUp : TrendingDown;
              return (
                <li
                  key={event.id}
                  data-testid="reputation-history-item"
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{formatReputationEvent(event.event_type)}</p>
                    <p className="text-xs text-muted-foreground">{formatEventDate(event.date)}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
                      positive ? "text-green-700 dark:text-green-400" : "text-destructive",
                    )}
                    data-testid="reputation-delta"
                  >
                    <DeltaIcon className="h-4 w-4" aria-hidden="true" />
                    {formatDelta(event.score_delta)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
