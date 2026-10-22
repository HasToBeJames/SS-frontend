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
import {
  formatSectors,
  type AutoInvestRule,
} from "@/lib/autoInvest";

interface AutoInvestRuleSummaryProps {
  rule: AutoInvestRule;
}

/** Read-only summary of the currently active auto-invest rule (#476). */
export function AutoInvestRuleSummary({ rule }: AutoInvestRuleSummaryProps) {
  return (
    <Card data-testid="auto-invest-rule-summary">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Current rule</CardTitle>
          <Badge
            variant={rule.isEnabled ? "default" : "secondary"}
            data-testid="auto-invest-summary-status"
          >
            {rule.isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <CardDescription>
          {rule.isEnabled
            ? rule.updatedAt
              ? `Last updated ${format(new Date(rule.updatedAt), "MMM d, yyyy HH:mm")}`
              : "Auto-invest is running with these settings"
            : "Saved, but auto-invest is currently off"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Tags className="h-3.5 w-3.5" aria-hidden="true" />
              Sectors
            </dt>
            <dd
              className="text-sm font-medium"
              data-testid="auto-invest-summary-sectors"
            >
              {formatSectors(rule.sectors)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Percent className="h-3.5 w-3.5" aria-hidden="true" />
              Minimum yield
            </dt>
            <dd
              className="text-sm font-medium"
              data-testid="auto-invest-summary-min-yield"
            >
              {rule.minYield}%
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Maximum invoice age
            </dt>
            <dd
              className="text-sm font-medium"
              data-testid="auto-invest-summary-max-age"
            >
              {rule.maxInvoiceAgeDays} day{rule.maxInvoiceAgeDays !== 1 ? "s" : ""}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              Max per invoice
            </dt>
            <dd
              className="text-sm font-medium"
              data-testid="auto-invest-summary-max-amount"
            >
              {rule.maxAmountPerInvoice.toLocaleString()} XLM
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
