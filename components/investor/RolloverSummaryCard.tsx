"use client";

import { format } from "date-fns";
import { CalendarClock, Percent, Tags, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AUTO_INVEST_SECTOR_LABELS, isAutoInvestSector } from "@/lib/autoInvest";
import type { RolloverConfig } from "@/lib/rollover";

interface RolloverSummaryCardProps {
  config: RolloverConfig;
}

/** Read-only summary of the active rollover criteria (#545). */
export function RolloverSummaryCard({ config }: RolloverSummaryCardProps) {
  const sectorLabel = isAutoInvestSector(config.sector)
    ? AUTO_INVEST_SECTOR_LABELS[config.sector]
    : config.sector;

  return (
    <Card data-testid="rollover-summary">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Active rollover</CardTitle>
          <Badge
            variant={config.isEnabled ? "default" : "secondary"}
            data-testid="rollover-summary-status"
          >
            {config.isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <CardDescription>
          {config.isEnabled
            ? config.updatedAt
              ? `Last updated ${format(new Date(config.updatedAt), "MMM d, yyyy HH:mm")}`
              : "Rollover is active with these criteria"
            : "Saved, but auto-rollover is currently off"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Tags className="h-3.5 w-3.5" aria-hidden="true" />
              Sector
            </dt>
            <dd className="text-sm font-medium" data-testid="rollover-summary-sector">
              {sectorLabel}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Percent className="h-3.5 w-3.5" aria-hidden="true" />
              Minimum yield
            </dt>
            <dd className="text-sm font-medium" data-testid="rollover-summary-min-yield">
              {config.minYield}%
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Maximum invoice age
            </dt>
            <dd className="text-sm font-medium" data-testid="rollover-summary-max-age">
              {config.maxInvoiceAgeDays} day{config.maxInvoiceAgeDays !== 1 ? "s" : ""}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              Maximum amount
            </dt>
            <dd className="text-sm font-medium" data-testid="rollover-summary-max-amount">
              {config.maxAmount.toLocaleString()} XLM
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
