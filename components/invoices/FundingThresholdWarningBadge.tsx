"use client";

/**
 * Threshold warning badge (#481)
 *
 * Shown on invoice cards and the detail page when the funding window closes
 * within 24 hours and the minimum threshold has not yet been met. Investors
 * can immediately see the risk that an invoice will fail to fund.
 */

import { AlertTriangle } from "lucide-react";
import { fundingThresholdState } from "@/components/invoices/FundingProgressBar";

interface FundingThresholdWarningBadgeProps {
  raised: number;
  target: number;
  minThreshold?: number | null;
  /** Hours remaining in the funding window. Null when the window is unknown. */
  hoursUntilClose?: number | null;
}

/**
 * Returns true when all conditions are met:
 * - There is a valid minimum threshold
 * - The threshold has NOT been crossed yet
 * - The funding window closes within 24 hours
 */
export function shouldShowThresholdWarning(
  raised: number,
  target: number,
  minThreshold: number | null | undefined,
  hoursUntilClose: number | null | undefined
): boolean {
  if (minThreshold == null || minThreshold <= 0) return false;
  const state = fundingThresholdState(raised, target, minThreshold);
  if (state !== "below_min") return false;
  if (hoursUntilClose == null) return false;
  return hoursUntilClose > 0 && hoursUntilClose <= 24;
}

export function FundingThresholdWarningBadge({
  raised,
  target,
  minThreshold,
  hoursUntilClose,
}: FundingThresholdWarningBadgeProps) {
  if (
    !shouldShowThresholdWarning(raised, target, minThreshold, hoursUntilClose)
  ) {
    return null;
  }

  const hoursText =
    hoursUntilClose != null && hoursUntilClose < 1
      ? "less than 1h"
      : `${Math.round(hoursUntilClose!)}h`;

  return (
    <span
      data-testid="threshold-warning-badge"
      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
      role="status"
      aria-label={`Minimum threshold not met — closes in ${hoursText}`}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      Min threshold unmet · closes in {hoursText}
    </span>
  );
}
