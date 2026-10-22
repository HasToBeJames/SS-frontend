"use client";

/**
 * Closed-unfunded refund status banner (#450)
 *
 * Displayed for investors who held partial positions in a closed-unfunded invoice,
 * informing them of their refund status.
 */

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/currency";

interface ClosedUnfundedBannerProps {
  investmentAmount: number;
  refundStatus: "pending" | "processing" | "completed";
  refundAmount?: number;
  refundDate?: string;
}

export function ClosedUnfundedBanner({
  investmentAmount,
  refundStatus,
  refundAmount = investmentAmount,
  refundDate,
}: ClosedUnfundedBannerProps) {
  const statusConfig = {
    pending: {
      icon: AlertCircle,
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-200",
      message: "Your investment will be refunded since the invoice did not reach funding",
    },
    processing: {
      icon: AlertCircle,
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      message: "Your refund is being processed",
    },
    completed: {
      icon: CheckCircle2,
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-200",
      message: "Your refund has been completed",
    },
  };

  const config = statusConfig[refundStatus];
  const Icon = config.icon;

  return (
    <Card className={`border ${config.border} ${config.bg}`} data-testid="closed-unfunded-banner">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Icon className={`h-5 w-5 shrink-0 ${config.text}`} />
          <div className="space-y-1">
            <p className={`text-sm font-medium ${config.text}`}>{config.message}</p>
            <p className={`text-xs ${config.text}/75`}>
              Amount:{" "}
              <Money xlm={refundAmount} className="font-semibold" />
              {refundDate && ` — Refunded on ${new Date(refundDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
