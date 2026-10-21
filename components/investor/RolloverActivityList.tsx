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
import type { RolloverExecutedEvent } from "@/lib/api";
import { sectorLabel } from "@/lib/autoInvest";

interface RolloverActivityListProps {
  events: RolloverExecutedEvent[];
}

/** Recent `RolloverExecuted` events: matured positions reinvested automatically (#545). */
export function RolloverActivityList({ events }: RolloverActivityListProps) {
  return (
    <Card data-testid="rollover-activity">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" aria-hidden="true" />
          Recent rollover activity
        </CardTitle>
        <CardDescription>Positions reinvested automatically at maturity</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p
            className="py-6 text-center text-sm text-muted-foreground"
            data-testid="rollover-activity-empty"
          >
            No rollovers yet. Your criteria apply when a position matures.
          </p>
        ) : (
          <ul className="divide-y">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-4 py-3"
                data-testid={`rollover-event-${event.id}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
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
