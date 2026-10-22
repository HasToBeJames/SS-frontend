"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useUpcomingMaturities } from "@/hooks/useActivity";
import {
  MATURITY_REMINDER_INTERVALS,
  buildMaturityReminderPreview,
  toggleMaturityReminderDay,
  type MaturityReminderInterval,
} from "@/lib/alertPreferences";

interface MaturityReminderSettingsProps {
  days: MaturityReminderInterval[];
  onChange: (days: MaturityReminderInterval[]) => void;
}

const UPCOMING_LIMIT = 25;

function intervalLabel(days: number): string {
  return days === 1 ? "1 day before" : `${days} days before`;
}

/**
 * Maturity reminder intervals plus a preview of the holdings they would fire
 * for (#542). The toggles only edit the draft; the parent form saves them.
 */
export function MaturityReminderSettings({ days, onChange }: MaturityReminderSettingsProps) {
  const { data, isLoading, isError } = useUpcomingMaturities(UPCOMING_LIMIT);

  const preview = useMemo(
    () => buildMaturityReminderPreview(data ?? [], days),
    [data, days],
  );

  return (
    <section data-testid="maturity-reminders" className="space-y-4 border-t pt-6">
      <div>
        <h3 className="text-sm font-medium">Maturity reminders</h3>
        <p className="text-xs text-muted-foreground">
          Get reminded before an invoice you hold reaches maturity.
        </p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {MATURITY_REMINDER_INTERVALS.map((interval) => (
          <div key={interval} className="flex items-center gap-2">
            <Switch
              id={`maturity-reminder-${interval}`}
              checked={days.includes(interval)}
              onCheckedChange={() => onChange(toggleMaturityReminderDay(days, interval))}
              data-testid={`maturity-reminder-toggle-${interval}`}
            />
            <Label htmlFor={`maturity-reminder-${interval}`} className="text-sm">
              {intervalLabel(interval)}
            </Label>
          </div>
        ))}
      </div>

      <div className="space-y-3" data-testid="maturity-reminder-preview">
        <h4 className="text-sm font-medium">Upcoming maturities</h4>
        {isLoading ? (
          <div className="space-y-2" aria-busy="true" data-testid="maturity-reminder-loading">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground" data-testid="maturity-reminder-error">
            Couldn&apos;t load your upcoming maturities.
          </p>
        ) : preview.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="maturity-reminder-empty">
            No upcoming maturities. Reminders will appear here once you hold an invoice.
          </p>
        ) : (
          <ul className="divide-y">
            {preview.map((item) => (
              <li
                key={item.invoiceId}
                className="space-y-1 py-3"
                data-testid={`maturity-preview-${item.invoiceId}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Matures {format(new Date(item.dueDate), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {days.length === 0
                    ? "Reminders are off"
                    : item.upcoming.length === 0
                      ? "No reminders left before maturity"
                      : `Reminders: ${item.upcoming
                          .map((schedule) => `${schedule.days}d on ${format(schedule.fireAt, "MMM d")}`)
                          .join(" · ")}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
