"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendingTimelockChanges } from "@/hooks/usePendingTimelockChanges";
import type { PendingTimelockChange } from "@/lib/api";

export const TIMELOCK_BANNER_DISMISS_KEY = "timelock-banner-dismissed";

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(TIMELOCK_BANNER_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function formatEtaCountdown(etaMs: number, nowMs: number): string {
  const total = Math.max(Math.floor((etaMs - nowMs) / 1000), 0);
  if (total === 0) return "Ready to execute";
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function ChangeRow({ change, now }: { change: PendingTimelockChange; now: number }) {
  const etaMs = new Date(change.eta).getTime();
  return (
    <li
      className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between"
      data-testid="timelock-change-item"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium break-words">{change.parameter}</p>
        <p className="text-xs">
          {change.current_value} <span aria-label="changing to">→</span>{" "}
          <span className="font-medium">{change.proposed_value}</span>
        </p>
      </div>
      <p className="text-xs tabular-nums sm:text-right" data-testid="timelock-change-eta">
        {Number.isNaN(etaMs) ? "ETA unknown" : formatEtaCountdown(etaMs, now)}
      </p>
    </li>
  );
}

export function TimelockPendingBanner() {
  const { data } = usePendingTimelockChanges();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const hasChanges = Boolean(data && data.length > 0);

  useEffect(() => {
    if (!hasChanges || dismissed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasChanges, dismissed]);

  if (!data || data.length === 0 || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(TIMELOCK_BANNER_DISMISS_KEY, "1");
    } catch {
      // Dismissal still applies for this page view.
    }
  };

  const soonest = [...data].sort(
    (a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime(),
  )[0];
  const multiple = data.length > 1;

  return (
    <section
      role="status"
      aria-label="Pending protocol changes"
      data-testid="timelock-banner"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium" data-testid="timelock-banner-title">
            {multiple
              ? `${data.length} protocol changes are scheduled`
              : "A protocol change is scheduled"}
          </p>
          {!multiple && (
            <ul data-testid="timelock-banner-list">
              <ChangeRow change={soonest} now={now} />
            </ul>
          )}
          {multiple && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 mt-1 h-7 px-2 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900"
                aria-expanded={expanded}
                aria-controls="timelock-banner-list"
                onClick={() => setExpanded((v) => !v)}
                data-testid="timelock-banner-toggle"
              >
                {expanded ? "Hide details" : "Show details"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </Button>
              {expanded && (
                <ul
                  id="timelock-banner-list"
                  className="divide-y divide-amber-200 dark:divide-amber-800"
                  data-testid="timelock-banner-list"
                >
                  {data.map((change) => (
                    <ChangeRow key={change.id} change={change} now={now} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900"
          onClick={dismiss}
          aria-label="Dismiss pending changes banner"
          data-testid="timelock-banner-dismiss"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
