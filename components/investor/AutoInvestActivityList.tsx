"use client";

import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, History } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AutoInvestExecutedEvent } from "@/lib/api";
import { sectorLabel } from "@/lib/autoInvest";

interface AutoInvestActivityListProps {
  events: AutoInvestExecutedEvent[];
}

/**
 * Recent `AutoInvestExecuted` events (#476).
 *
 * Each row is an invoice the protocol bought automatically because it matched
 * the investor's rule.
 */
export function AutoInvestActivityList({ events }: AutoInvestActivityListProps) {
  return (
    <Card data-testid="auto-invest-activity">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" aria-hidden="true" />
          Recent auto-invest activity
        </CardTitle>
        <CardDescription>
          Investments executed automatically by your rule
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p
            className="py-6 text-center text-sm text-muted-foreground"
            data-testid="auto-invest-activity-empty"
          >
            No auto-investments yet. Your rule runs when a matching invoice is
            published.
          </p>
        ) : (
          <ul className="divide-y">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-4 py-3"
                data-testid={`auto-invest-event-${event.id}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/marketplace/${event.invoice_id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {event.invoice_title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {event.sector ? `${sectorLabel(event.sector)} · ` : ""}
                      {format(new Date(event.executed_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-right">
                  <Badge variant="secondary">{event.yield_percentage}%</Badge>
                  <span className="font-mono text-sm font-medium">
                    {event.amount.toLocaleString()} XLM
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
