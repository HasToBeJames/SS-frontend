"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAccreditationStatus } from "@/hooks/useAccreditationStatus";
import {
  ACCREDITATION_RENEWAL_ROUTE,
  getRenewalCountdown,
  getRenewalSeverity,
  type RenewalSeverity,
} from "@/lib/accreditationRenewal";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<RenewalSeverity, string> = {
  notice: "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-100",
  warning: "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-100",
  critical: "border-red-400 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/30 dark:text-red-100",
};

/** Countdown precision is hours, so the clock only needs to tick once a minute. */
const TICK_MS = 60_000;

/**
 * Renewal prompt for the connected investor's accreditation (#543).
 *
 * Shown on the dashboard and profile once the expiry is under 60 days away:
 * yellow below 60 days, amber below 30, red below 7. Renewing moves the expiry
 * out of range, so the banner disappears on the next status refresh.
 */
export function AccreditationRenewalBanner() {
  const { data } = useAccreditationStatus();
  const expiresAt = data?.expires_at ?? null;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [expiresAt]);

  const severity = getRenewalSeverity(expiresAt, now);
  if (!expiresAt || !severity) return null;

  const { days, hours, expired } = getRenewalCountdown(expiresAt, now);
  const isCritical = severity === "critical";

  return (
    <div
      role={isCritical ? "alert" : "status"}
      data-testid="accreditation-renewal-banner"
      data-severity={severity}
      className={cn(
        "flex flex-col gap-3 rounded-md border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        SEVERITY_STYLES[severity],
      )}
    >
      <div className="space-y-0.5">
        <p className="font-medium">
          {expired ? "Your accreditation has expired" : "Your accreditation is expiring soon"}
        </p>
        <p className="text-xs opacity-80">
          {expired ? (
            "Renew to keep investing in high-value invoices."
          ) : (
            <>
              Time left:{" "}
              <span className="font-mono" data-testid="accreditation-renewal-countdown">
                {days}d {hours}h
              </span>
            </>
          )}
        </p>
      </div>
      <Button
        asChild
        size="sm"
        variant={isCritical ? "destructive" : "default"}
        className="shrink-0"
      >
        <Link href={ACCREDITATION_RENEWAL_ROUTE}>Renew now</Link>
      </Button>
    </div>
  );
}
