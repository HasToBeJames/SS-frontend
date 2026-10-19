"use client";

/**
 * FundingFailedCard (#481)
 *
 * Replaces the normal funding progress section when an invoice failed to meet
 * its minimum threshold and the refund has been (or is being) triggered.
 */

import { XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function formatAmount(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

interface FundingFailedCardProps {
  /** Amount raised before the window closed. */
  raised: number;
  /** Minimum threshold that was required. */
  minThreshold: number;
  /** Date the funding window closed. */
  closedAt?: string | null;
  /** Refund status reported by the contract. */
  refundStatus?: "pending" | "processing" | "completed" | null;
}

const REFUND_STATUS_CONFIG = {
  pending: {
    label: "Refund queued",
    description: "Your investment will be refunded automatically once the refund transaction is processed on-chain.",
    color: "text-amber-700 dark:text-amber-300",
  },
  processing: {
    label: "Refund in progress",
    description: "The refund transaction is being confirmed on the Stellar network.",
    color: "text-blue-700 dark:text-blue-300",
  },
  completed: {
    label: "Refund complete",
    description: "Your investment has been refunded to your wallet.",
    color: "text-green-700 dark:text-green-300",
  },
} as const;

export function FundingFailedCard({
  raised,
  minThreshold,
  closedAt,
  refundStatus,
}: FundingFailedCardProps) {
  const gap = Math.max(0, minThreshold - raised);
  const refundCfg = refundStatus ? REFUND_STATUS_CONFIG[refundStatus] : null;

  return (
    <Card
      className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
      data-testid="funding-failed-card"
    >
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <XCircle
            className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <p className="font-semibold text-red-800 dark:text-red-200">
              Funding failed — minimum threshold not reached
            </p>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-red-700/70 dark:text-red-300/70">Raised</dt>
                <dd
                  className="font-medium text-red-800 dark:text-red-200"
                  data-testid="funding-failed-raised"
                >
                  {formatAmount(raised)} XLM
                </dd>
              </div>
              <div>
                <dt className="text-xs text-red-700/70 dark:text-red-300/70">Min threshold</dt>
                <dd
                  className="font-medium text-red-800 dark:text-red-200"
                  data-testid="funding-failed-threshold"
                >
                  {formatAmount(minThreshold)} XLM
                </dd>
              </div>
              <div>
                <dt className="text-xs text-red-700/70 dark:text-red-300/70">Gap</dt>
                <dd
                  className="font-medium text-red-800 dark:text-red-200"
                  data-testid="funding-failed-gap"
                >
                  {formatAmount(gap)} XLM short
                </dd>
              </div>
            </dl>

            {closedAt && (
              <p className="text-xs text-red-700/70 dark:text-red-300/70">
                Window closed on{" "}
                {new Date(closedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}

            {refundCfg && (
              <p
                className={`text-sm font-medium ${refundCfg.color}`}
                data-testid="funding-failed-refund-status"
              >
                {refundCfg.label}
                {" — "}
                <span className="font-normal">{refundCfg.description}</span>
              </p>
            )}

            {!refundCfg && (
              <p className="text-sm text-red-700/80 dark:text-red-300/80">
                Invested funds will be refunded to all investor wallets.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
