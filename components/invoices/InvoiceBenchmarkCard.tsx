"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoiceBenchmark } from "@/hooks/useInvoiceBenchmark";

function Metric({
  label,
  invoice,
  sector,
  higherIsBetter,
  suffix,
}: {
  label: string;
  invoice: number | null;
  sector: number;
  higherIsBetter: boolean;
  suffix: string;
}) {
  if (invoice === null) {
    return (
      <div className="rounded-md border p-3" data-testid={`benchmark-${label}`}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-medium">No settlement history</p>
        <p className="text-xs text-muted-foreground">Sector average: {sector}{suffix}</p>
      </div>
    );
  }

  const above = higherIsBetter ? invoice >= sector : invoice <= sector;
  const Icon = invoice === sector ? Minus : above ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-md border p-3" data-testid={`benchmark-${label}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className={`mt-1 flex items-center gap-1 font-semibold ${above ? "text-green-600" : "text-red-600"}`}>
        <Icon className="h-4 w-4" />
        {invoice}{suffix}
      </div>
      <p className="text-xs text-muted-foreground">Sector average: {sector}{suffix}</p>
    </div>
  );
}

export function InvoiceBenchmarkCard({ invoiceId }: { invoiceId: string }) {
  const { data, isLoading, isError } = useInvoiceBenchmark(invoiceId);
  if (isLoading) return <Skeleton className="h-40 w-full" data-testid="benchmark-loading" />;
  if (isError || !data) return null;

  return (
    <Card data-testid="invoice-benchmark">
      <CardHeader>
        <CardTitle>Sector benchmark · {data.sector}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <Metric label="Yield" invoice={data.invoice_yield} sector={data.sector_avg_yield} higherIsBetter suffix="%" />
        <Metric label="Settlement speed" invoice={data.invoice_avg_settlement_days} sector={data.sector_avg_settlement_days} higherIsBetter={false} suffix=" days" />
        <Metric label="Default rate" invoice={data.issuer_default_rate} sector={data.sector_default_rate} higherIsBetter={false} suffix="%" />
      </CardContent>
    </Card>
  );
}
