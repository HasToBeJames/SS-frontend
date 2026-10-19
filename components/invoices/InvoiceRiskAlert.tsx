"use client";

import { AlertTriangle } from "lucide-react";
import { useInvoiceRiskStatus } from "@/hooks/useInvoiceRiskStatus";
import type { InvoiceRiskSeverity, InvoiceRiskType } from "@/lib/api";

const RISK_LABELS: Record<InvoiceRiskType, string> = {
  funding_risk: "Funding Risk",
  late_payment: "Late Payment",
  default_proximity: "Default Proximity",
};

const SEVERITY_STYLES: Record<InvoiceRiskSeverity, string> = {
  low: "border-yellow-400 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200",
  medium: "border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-950/30 dark:text-orange-200",
  high: "border-red-500 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200",
};

export function InvoiceRiskAlert({ invoiceId }: { invoiceId: string }) {
  const { data } = useInvoiceRiskStatus(invoiceId);
  if (!data?.active || !data.risk_type || !data.severity) return null;

  return (
    <div
      role="alert"
      data-testid="invoice-risk-alert"
      data-severity={data.severity}
      className={`rounded-lg border-l-4 p-4 ${SEVERITY_STYLES[data.severity]}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">
            {RISK_LABELS[data.risk_type]} · {data.severity[0].toUpperCase() + data.severity.slice(1)} risk
          </p>
          {data.recommended_action && <p className="mt-1 text-sm">{data.recommended_action}</p>}
        </div>
      </div>
    </div>
  );
}

export function PortfolioRiskIndicator({ invoiceId }: { invoiceId: string }) {
  const { data } = useInvoiceRiskStatus(invoiceId);
  if (!data?.active || !data.risk_type || !data.severity) return null;

  return (
    <span
      title={`${RISK_LABELS[data.risk_type]} (${data.severity})`}
      aria-label={`${RISK_LABELS[data.risk_type]}, ${data.severity} risk`}
      data-testid={`portfolio-risk-${invoiceId}`}
      className="inline-flex text-red-600 dark:text-red-400"
    >
      <AlertTriangle className="h-4 w-4" />
    </span>
  );
}
