"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoicePools } from "@/hooks/useInvoicePools";
import { weightedAverageYield } from "@/lib/pools";

/** Invoices / Pools filter tabs shared by the marketplace and the pool list. */
export function MarketplaceViewTabs({ active }: { active: "invoices" | "pools" | "leaderboard" }) {
  const base = "rounded-full px-4 py-1.5 text-sm font-medium transition-colors";
  const on = "bg-primary text-primary-foreground";
  const off =
    "border border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground";

  return (
    <nav aria-label="Marketplace view" className="flex gap-2" data-testid="marketplace-view-tabs">
      <Link
        href="/marketplace"
        aria-current={active === "invoices" ? "page" : undefined}
        className={`${base} ${active === "invoices" ? on : off}`}
        data-testid="marketplace-tab-invoices"
      >
        Invoices
      </Link>
      <Link
        href="/marketplace/pools"
        aria-current={active === "pools" ? "page" : undefined}
        className={`${base} ${active === "pools" ? on : off}`}
        data-testid="marketplace-tab-pools"
      >
        Pools
      </Link>
      <Link
        href="/marketplace/invoice-leaderboard"
        aria-current={active === "leaderboard" ? "page" : undefined}
        className={`${base} ${active === "leaderboard" ? on : off}`}
        data-testid="marketplace-tab-leaderboard"
      >
        Leaderboard
      </Link>
    </nav>
  );
}

export function PoolList() {
  const { data, isLoading, isError } = useInvoicePools();
  const pools = data?.pools ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Invoice pools</h1>
        <MarketplaceViewTabs active="pools" />
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="pool-list-loading">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive" role="alert">
          Could not load pools. Refresh to try again.
        </p>
      )}

      {!isLoading && !isError && pools.length === 0 && (
        <p className="text-sm text-muted-foreground" data-testid="pool-list-empty">
          No pools are open yet. Check back soon.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {pools.map((pool) => (
          <Link
            key={pool.id}
            href={`/marketplace/pools/${encodeURIComponent(pool.id)}`}
            data-testid={`pool-card-${pool.id}`}
          >
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <h2 className="font-semibold">{pool.name}</h2>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Invoices</p>
                  <p className="font-medium">{pool.invoices.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. yield</p>
                  <p className="font-medium">{weightedAverageYield(pool.invoices).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">TVL</p>
                  <p className="font-medium">{pool.tvl.toLocaleString()} XLM</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
