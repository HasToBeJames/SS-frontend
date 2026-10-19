"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InvoiceMaturityStatus } from "@/components/invoices/InvoiceMaturityStatus";
import { useInvoiceEvents } from "@/hooks/useInvoiceEvents";
import {
  GRACE_PERIOD_DAYS,
  MATURITY_PHASE_LABELS,
  computeLatePenalty,
  getMaturityState,
  type InvoiceEvent,
  type MaturityPhase,
} from "@/lib/maturity";
import { Money } from "@/components/currency";
import { cn } from "@/lib/utils";

const PHASE_STYLES: Record<MaturityPhase, string> = {
  upcoming: "bg-secondary text-secondary-foreground",
  grace: "bg-amber-100 text-amber-800",
  penalty: "bg-orange-100 text-orange-800",
  default_risk: "bg-red-100 text-red-800",
  defaulted: "bg-red-600 text-white",
};

const EVENT_LABELS: Record<InvoiceEvent["type"], string> = {
  MaturityMissed: "Maturity missed",
  PenaltyAccrued: "Late penalty accrued",
  Funded: "Funded",
  Settled: "Settled",
};

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

interface InvoiceMaturitySectionProps {
  invoiceId: string;
  maturityDate: string | null | undefined;
  faceValue: number;
  /** Penalty reported by the API; overrides the computed estimate. */
  latePenaltyAccrued?: number | null;
  now?: number;
}

export function InvoiceMaturitySection({
  invoiceId,
  maturityDate,
  faceValue,
  latePenaltyAccrued,
  now,
}: InvoiceMaturitySectionProps) {
  const hasDate = Boolean(maturityDate);
  const { data: events } = useInvoiceEvents(invoiceId, hasDate);

  if (!hasDate) return null;

  const state = getMaturityState(maturityDate as string, now);
  const penalty = latePenaltyAccrued ?? computeLatePenalty(faceValue, state.penaltyDays);
  const maturityEvents = (events ?? []).filter(
    (e) => e.type === "MaturityMissed" || e.type === "PenaltyAccrued"
  );

  return (
    <Card data-testid="maturity-section">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Maturity</h2>
          <span
            className={cn("rounded-full px-3 py-1 text-xs font-medium", PHASE_STYLES[state.phase])}
            data-testid="maturity-status-chip"
          >
            {MATURITY_PHASE_LABELS[state.phase]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Due date</dt>
            <dd className="font-medium" data-testid="maturity-due-date">
              {formatDate(maturityDate as string)}
            </dd>
          </div>
          {state.daysOverdue > 0 && (
            <div>
              <dt className="text-muted-foreground">Days overdue</dt>
              <dd className="font-medium tabular-nums" data-testid="maturity-days-overdue">
                {state.daysOverdue}
              </dd>
            </div>
          )}
        </dl>

        <InvoiceMaturityStatus maturityDate={maturityDate} />

        {state.phase === "grace" && (
          <div className="space-y-1" data-testid="grace-period-bar">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Grace period</span>
              <span>
                {state.daysOverdue} of {GRACE_PERIOD_DAYS} days used
              </span>
            </div>
            <Progress
              value={(state.daysOverdue / GRACE_PERIOD_DAYS) * 100}
              aria-label="Grace period used"
            />
          </div>
        )}

        {state.penaltyDays > 0 && (
          <div className="flex items-center justify-between text-sm" data-testid="late-penalty">
            <span className="text-muted-foreground">Late penalty accrued</span>
            <span className="font-medium tabular-nums" data-testid="late-penalty-amount">
              <Money xlm={penalty} />
            </span>
          </div>
        )}

        {state.daysUntilDefault !== null && state.phase !== "defaulted" && (
          <p
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
            data-testid="default-countdown"
          >
            {state.daysUntilDefault} day{state.daysUntilDefault === 1 ? "" : "s"} until this invoice
            is marked as defaulted.
          </p>
        )}

        {maturityEvents.length > 0 && (
          <div data-testid="maturity-activity">
            <h3 className="mb-2 text-sm font-medium">Activity</h3>
            <ul className="space-y-2">
              {maturityEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between text-sm"
                  data-testid={`maturity-event-${event.id}`}
                >
                  <span>{EVENT_LABELS[event.type]}</span>
                  <span className="text-muted-foreground">
                    {event.amount ? <Money xlm={event.amount} /> : null}{" "}
                    {formatDate(event.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
