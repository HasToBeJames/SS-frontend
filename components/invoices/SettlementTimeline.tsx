"use client";

import { CheckCircle2, CircleDollarSign, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useInterimPayments } from "@/hooks/useInterimPayments";
import {
  buildSettlementTimeline,
  formatPaymentAmount,
  formatPaymentDate,
} from "@/lib/settlementTimeline";

interface SettlementTimelineProps {
  invoiceId: string;
  /** Face value the issuer is expected to repay. */
  totalDue: number;
  /** Invoice status is `settled`, used to badge the closing payment. */
  isSettled?: boolean;
  className?: string;
}

/**
 * Partial-settlement history for an invoice (#478).
 *
 * A vertical ledger of every interim payment the issuer has made, with a
 * running cumulative total and remaining balance. The header progress bar
 * shows how much of the face value has been repaid, and the payment that
 * closes the invoice is badged "Settled".
 */
export function SettlementTimeline({
  invoiceId,
  totalDue,
  isSettled = false,
  className,
}: SettlementTimelineProps) {
  const { data, isLoading, isError } = useInterimPayments(invoiceId);

  if (isLoading) {
    return (
      <Card className={className} data-testid="settlement-timeline-loading">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={className} data-testid="settlement-timeline-error">
        <CardHeader>
          <CardTitle className="text-base">Settlement history</CardTitle>
          <CardDescription>
            Repayment history is unavailable right now. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const summary = buildSettlementTimeline(data?.payments ?? [], {
    totalDue: data?.total_due ?? totalDue,
    isSettled,
  });

  return (
    <Card className={className} data-testid="settlement-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ReceiptText className="h-4 w-4" aria-hidden="true" />
          Settlement history
        </CardTitle>
        <CardDescription>
          Interim and final payments made by the issuer
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Repayment progress against the total due. */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium" data-testid="settlement-repaid-percent">
              {summary.repaidPercent.toFixed(1)}% repaid
            </span>
            <span className="text-muted-foreground">
              {formatPaymentAmount(summary.totalPaid)} of{" "}
              {formatPaymentAmount(summary.totalDue)}
            </span>
          </div>
          <Progress
            value={summary.repaidPercent}
            aria-label="Repayment progress"
            data-testid="settlement-progress"
            data-percent={Math.round(summary.repaidPercent)}
          />
          <p
            className="text-xs text-muted-foreground"
            data-testid="settlement-remaining"
          >
            {formatPaymentAmount(summary.remaining)} remaining
          </p>
        </div>

        {summary.entries.length === 0 ? (
          <div
            className="rounded-lg border border-dashed py-8 text-center"
            data-testid="settlement-timeline-empty"
          >
            <p className="text-sm text-muted-foreground">
              No payments have been made yet.
            </p>
          </div>
        ) : (
          <ol className="space-y-0">
            {summary.entries.map((entry, index) => {
              const isLast = index === summary.entries.length - 1;
              return (
                <li
                  key={entry.id}
                  className="relative flex gap-4 pb-6 last:pb-0"
                  data-testid={`settlement-entry-${entry.id}`}
                  data-final={entry.isFinal}
                >
                  <div className="flex flex-col items-center">
                    {entry.isFinal ? (
                      <CheckCircle2
                        className="h-5 w-5 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                    ) : (
                      <CircleDollarSign
                        className="h-5 w-5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    )}
                    {!isLast && (
                      <span
                        className="mt-1 w-px flex-1 bg-border"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p
                        className="text-sm font-medium"
                        data-testid={`settlement-entry-date-${entry.id}`}
                      >
                        {formatPaymentDate(entry.paidAt)}
                      </p>
                      {entry.isFinal && (
                        <Badge
                          variant="default"
                          className="bg-emerald-600 text-white"
                          data-testid="settlement-final-badge"
                        >
                          Settled
                        </Badge>
                      )}
                    </div>

                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-muted-foreground">Payment</dt>
                        <dd
                          className="font-medium"
                          data-testid={`settlement-entry-amount-${entry.id}`}
                        >
                          {formatPaymentAmount(entry.amount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Cumulative
                        </dt>
                        <dd
                          className="font-medium"
                          data-testid={`settlement-entry-cumulative-${entry.id}`}
                        >
                          {formatPaymentAmount(entry.cumulativePaid)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Remaining
                        </dt>
                        <dd
                          className="font-medium"
                          data-testid={`settlement-entry-remaining-${entry.id}`}
                        >
                          {formatPaymentAmount(entry.remaining)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
