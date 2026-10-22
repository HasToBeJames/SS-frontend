"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComparisonProvider,
  EmptyWatchlist,
  InvoiceCard,
} from "@/components/marketplace";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Investor watchlist (#474).
 *
 * Lists the wallets's watched invoices as full `InvoiceCard`s, each carrying a
 * state-change badge and a bell to unwatch. The list itself comes from the
 * on-chain registry via the connected wallet.
 */
export default function WatchlistPage() {
  usePageTitle("Watchlist");
  const router = useRouter();
  const { isConnected } = useStellarWallet();
  const { invoices, count, isLoading, isError, refetch, isPending } =
    useWatchlist();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Bell className="h-7 w-7 text-primary" aria-hidden="true" />
            Watchlist
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isConnected
              ? `Invoices you are monitoring (${count})`
              : "Connect your wallet to view the invoices you are monitoring"}
          </p>
        </div>
        {isConnected && count > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isPending()}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        )}
      </div>

      {!isConnected ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center"
          data-testid="watchlist-connect-wallet"
        >
          <Wallet className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Connect your wallet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Your watchlist lives on-chain against your wallet address. Connect
            to sync the invoices you are monitoring.
          </p>
          <Button asChild className="mt-6">
            <Link href="/connect-wallet">Connect Wallet</Link>
          </Button>
        </div>
      ) : isLoading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          data-testid="watchlist-loading"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <WatchlistCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center"
          data-testid="watchlist-error"
        >
          <h2 className="text-lg font-semibold">Couldn&apos;t load your watchlist</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The registry did not respond. Check your connection and try again.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => refetch()}>
            <Loader2 className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : invoices.length === 0 ? (
        <EmptyWatchlist />
      ) : (
        <ComparisonProvider>
          <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            data-testid="watchlist-grid"
          >
            {invoices.map(({ invoice, stateChange }) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                stateChange={stateChange}
                onInvest={() => router.push(`/marketplace/${invoice.id}`)}
              />
            ))}
          </div>
        </ComparisonProvider>
      )}
    </main>
  );
}

function WatchlistCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4" data-testid="watchlist-card-skeleton">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-2 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}
