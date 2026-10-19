"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvestPoolMutation, useInvoicePool } from "@/hooks/useInvoicePools";
import { useWallet } from "@/context/WalletContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { InvoicePool } from "@/lib/api";
import { allocatePool, weightedAverageYield } from "@/lib/pools";

function PoolInvestPanel({ pool }: { pool: InvoicePool }) {
  const { address, isConnected } = useWallet();
  const [amount, setAmount] = useState("");
  const mutation = useInvestPoolMutation(pool.id);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0;
  const allocations = valid ? allocatePool(value, pool.invoices) : [];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !address) return;
    mutation.mutate({ amount: value, wallet: address }, { onSuccess: () => setAmount("") });
  }

  return (
    <Card data-testid="pool-invest-panel">
      <CardHeader>
        <h2 className="text-lg font-semibold">Invest in this pool</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="pool-invest-amount">Amount (XLM)</Label>
            <Input
              id="pool-invest-amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="pool-amount-input"
            />
          </div>

          {valid && (
            <div data-testid="pool-allocation-preview">
              <p className="mb-2 text-sm font-medium">Allocation preview</p>
              <ul className="space-y-1 text-sm">
                {allocations.map((allocation) => (
                  <li
                    key={allocation.invoice_id}
                    className="flex justify-between"
                    data-testid={`pool-allocation-${allocation.invoice_id}`}
                  >
                    <span className="text-muted-foreground">{allocation.name}</span>
                    <span className="tabular-nums">
                      {allocation.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      XLM
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isConnected && (
            <p className="text-sm text-muted-foreground">Connect a wallet to invest.</p>
          )}

          <Button
            type="submit"
            disabled={!valid || !isConnected || mutation.isPending}
            data-testid="pool-invest-submit"
          >
            {mutation.isPending ? "Investing..." : "Invest in pool"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function PoolDetail({ poolId }: { poolId: string }) {
  const { data: pool, isLoading, isError } = useInvoicePool(poolId);
  usePageTitle(pool?.name ?? null);

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="pool-detail-loading">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !pool) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center" role="alert">
        <h1 className="text-xl font-semibold">Pool not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This pool may have been removed, or the link may be incorrect.
        </p>
        <Button asChild className="mt-6">
          <Link href="/marketplace/pools">Back to pools</Link>
        </Button>
      </div>
    );
  }

  const averageYield = weightedAverageYield(pool.invoices);

  return (
    <div className="space-y-6" data-testid="pool-detail">
      <div>
        <Link
          href="/marketplace/pools"
          className="text-sm text-muted-foreground hover:underline"
        >
          All pools
        </Link>
        <h1 className="mt-1 text-2xl font-bold" data-testid="pool-name">
          {pool.name}
        </h1>
        {pool.description && (
          <p className="mt-1 text-sm text-muted-foreground">{pool.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Weighted average yield</p>
            <p className="text-2xl font-semibold" data-testid="pool-weighted-yield">
              {averageYield.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total value locked</p>
            <p className="text-2xl font-semibold" data-testid="pool-tvl">
              {pool.tvl.toLocaleString()} XLM
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Composition</h2>
        </CardHeader>
        <CardContent>
          <Table data-testid="pool-composition-table">
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Yield</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pool.invoices.map((invoice) => (
                <TableRow key={invoice.invoice_id} data-testid={`pool-row-${invoice.invoice_id}`}>
                  <TableCell>
                    <Link
                      href={`/invoices/${encodeURIComponent(invoice.invoice_id)}`}
                      className="hover:underline"
                    >
                      {invoice.name}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.sector}</TableCell>
                  <TableCell className="text-right tabular-nums">{invoice.weight}%</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {invoice.yield_percentage}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PoolInvestPanel pool={pool} />
    </div>
  );
}
