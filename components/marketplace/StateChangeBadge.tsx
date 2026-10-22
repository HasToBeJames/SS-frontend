"use client";

import { CheckCircle2, Hourglass, Rocket, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  WatchlistStateChange,
  WatchlistStateChangeKind,
} from "@/lib/watchlist";

interface StateChangeBadgeProps {
  change: WatchlistStateChange;
  className?: string;
}

const ICONS: Record<WatchlistStateChangeKind, typeof Rocket> = {
  now_funded: Rocket,
  matured: Hourglass,
  settled: CheckCircle2,
  now_open: Sparkles,
};

const TONE_CLASSES: Record<WatchlistStateChangeKind, string> = {
  now_funded: "border-transparent bg-emerald-100 text-emerald-900",
  matured: "border-amber-300 bg-amber-100 text-amber-900",
  settled: "border-transparent bg-sky-100 text-sky-900",
  now_open: "border-transparent bg-primary/10 text-primary",
};

/**
 * Pill announcing a recent transition on a watched invoice (#474).
 *
 * Rendered by the watchlist card and, when supplied, by `InvoiceCard` itself so
 * the signal follows the invoice wherever the investor sees it.
 */
export function StateChangeBadge({ change, className }: StateChangeBadgeProps) {
  const Icon = ICONS[change.kind];

  return (
    <Badge
      variant="outline"
      title={change.description}
      data-testid="state-change-badge"
      data-change-kind={change.kind}
      className={cn("gap-1", TONE_CLASSES[change.kind], className)}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {change.label}
    </Badge>
  );
}
