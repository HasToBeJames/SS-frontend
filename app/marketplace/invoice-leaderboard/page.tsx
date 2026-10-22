"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useInvoiceLeaderboard } from "@/hooks/useInvoiceLeaderboard";
import { MarketplaceViewTabs } from "@/components/pools/PoolList";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_OPTIONS, categoryLabel } from "@/lib/invoiceTaxonomy";
import {
  LEADERBOARD_METRIC_LABELS,
  formatLeaderboardValue,
  rankEntries,
} from "@/lib/invoiceLeaderboard";
import { INVOICE_LEADERBOARD_METRICS, type InvoiceLeaderboardMetric } from "@/lib/api";

const CHIP_BASE = "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors";
const CHIP_ACTIVE = `${CHIP_BASE} bg-primary text-primary-foreground`;
const CHIP_IDLE = `${CHIP_BASE} border border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground`;

export default function InvoiceLeaderboardPage() {
  usePageTitle("Invoice Leaderboard");
  const [metric, setMetric] = useState<InvoiceLeaderboardMetric>("yield_rate");
  const [sector, setSector] = useState<string | null>(null);
  const { data, isLoading, isError } = useInvoiceLeaderboard(metric);

  const rows = useMemo(() => rankEntries(data ?? [], sector), [data, sector]);

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Invoice Leaderboard</h1>
        <MarketplaceViewTabs active="leaderboard" />
        <p className="text-muted-foreground">
          The top 50 invoices on the platform, ranked by performance.
        </p>
      </div>

      <Tabs value={metric} onValueChange={(value) => setMetric(value as InvoiceLeaderboardMetric)}>
        <TabsList className="h-auto flex-wrap">
          {INVOICE_LEADERBOARD_METRICS.map((m) => (
            <TabsTrigger key={m} value={m} data-testid={`leaderboard-tab-${m}`}>
              {LEADERBOARD_METRIC_LABELS[m]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div
        role="group"
        aria-label="Filter by sector"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
        data-testid="leaderboard-sector-chips"
      >
        <button
          type="button"
          aria-pressed={sector === null}
          onClick={() => setSector(null)}
          className={sector === null ? CHIP_ACTIVE : CHIP_IDLE}
          data-testid="leaderboard-sector-all"
        >
          All sectors
        </button>
        {CATEGORY_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={sector === value}
            onClick={() => setSector(value)}
            className={sector === value ? CHIP_ACTIVE : CHIP_IDLE}
            data-testid={`leaderboard-sector-${value}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" data-testid="leaderboard-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-muted-foreground" data-testid="leaderboard-error">
          Couldn&apos;t load the leaderboard.
        </p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground" data-testid="leaderboard-empty">
          No invoices in this sector.
        </p>
      ) : (
        <ol className="divide-y rounded-lg border" data-testid="leaderboard-list">
          {rows.map((row) => (
            <li
              key={row.invoice_id}
              className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 gap-y-1 p-4 md:grid-cols-[3rem_2fr_1.5fr_auto_auto] md:gap-x-6"
              data-testid={`leaderboard-row-${row.invoice_id}`}
            >
              <Badge variant="outline" className="justify-center" data-testid={`leaderboard-position-${row.position}`}>
                #{row.position}
              </Badge>
              <Link
                href={`/marketplace/${row.invoice_id}`}
                className="min-w-0 truncate font-medium hover:underline"
              >
                {row.invoice_name}
              </Link>
              <span
                className="text-right font-semibold tabular-nums md:order-4"
                data-testid={`leaderboard-value-${row.invoice_id}`}
              >
                {formatLeaderboardValue(metric, row.metric_value)}
              </span>
              <span className="col-start-2 truncate text-sm text-muted-foreground md:col-start-auto">
                {row.issuer}
              </span>
              <Badge variant="secondary" className="col-start-3 justify-self-end md:order-5">
                {categoryLabel(row.sector)}
              </Badge>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
