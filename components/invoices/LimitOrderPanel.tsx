"use client";

/**
 * Limit Order Panel — Secondary Market Buy Orders (#480)
 *
 * Shown as a tab alongside "Buy Now" in the secondary market section of the
 * invoice detail page. Investors set a max price per fraction; the order is
 * matched automatically on-chain when a listing meets the price.
 */

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCancelLimitOrderMutation, useLimitOrders, usePlaceLimitOrderMutation } from "@/hooks/useLimitOrders";
import type { LimitOrder } from "@/lib/api";

function formatAmount(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Order form ─────────────────────────────────────────────────────────────

interface OrderFormProps {
  invoiceId: string;
  onPlaced?: () => void;
}

function LimitOrderForm({ invoiceId, onPlaced }: OrderFormProps) {
  const [fractionAmount, setFractionAmount] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const placeMutation = usePlaceLimitOrderMutation();

  const fractionAmountNum = parseFloat(fractionAmount);
  const maxPriceNum = parseFloat(maxPrice);

  const isValid =
    Number.isFinite(fractionAmountNum) &&
    fractionAmountNum > 0 &&
    Number.isFinite(maxPriceNum) &&
    maxPriceNum > 0;

  const totalEscrowed = isValid ? fractionAmountNum * maxPriceNum : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    placeMutation.mutate(
      {
        invoice_id: invoiceId,
        fraction_amount: fractionAmountNum,
        max_price_per_fraction: maxPriceNum,
      },
      {
        onSuccess: () => {
          setFractionAmount("");
          setMaxPrice("");
          onPlaced?.();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="limit-order-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fraction-amount">Fraction amount</Label>
          <Input
            id="fraction-amount"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 10"
            value={fractionAmount}
            onChange={(e) => setFractionAmount(e.target.value)}
            data-testid="limit-order-fraction-input"
            aria-describedby="fraction-amount-hint"
          />
          <p id="fraction-amount-hint" className="text-xs text-muted-foreground">
            Number of fractions to buy
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="max-price">Max price per fraction (XLM)</Label>
          <Input
            id="max-price"
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="e.g. 105.00"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            data-testid="limit-order-price-input"
            aria-describedby="max-price-hint"
          />
          <p id="max-price-hint" className="text-xs text-muted-foreground">
            Order executes when any listing's ask price ≤ this value
          </p>
        </div>
      </div>

      {/* Order summary */}
      {isValid && (
        <div
          className="rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1"
          data-testid="limit-order-summary"
          role="region"
          aria-label="Order summary"
        >
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total escrowed</span>
            <span className="font-semibold" data-testid="limit-order-escrowed">
              {formatAmount(totalEscrowed)} XLM
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Funds are held in escrow and released if the order is cancelled or expires.
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || placeMutation.isPending}
        data-testid="place-limit-order-btn"
      >
        {placeMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        Place Order
      </Button>
    </form>
  );
}

// ─── Active orders list ──────────────────────────────────────────────────────

interface ActiveOrdersListProps {
  walletAddress: string | null | undefined;
}

function ActiveOrdersList({ walletAddress }: ActiveOrdersListProps) {
  const { data: orders, isLoading } = useLimitOrders(walletAddress);
  const cancelMutation = useCancelLimitOrderMutation(walletAddress);

  if (!walletAddress) return null;

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="active-orders-loading">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground" data-testid="no-active-orders">
        No open limit orders
      </p>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Active limit orders" data-testid="active-orders-list">
      {orders.map((order: LimitOrder) => {
        const isCancelling =
          cancelMutation.isPending && cancelMutation.variables === order.id;

        return (
          <li
            key={order.id}
            className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
            data-testid={`limit-order-${order.id}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {order.fraction_amount.toLocaleString()} fractions @ max{" "}
                {formatAmount(order.max_price_per_fraction)} XLM
              </p>
              <p className="text-xs text-muted-foreground">
                Escrowed: {formatAmount(order.total_escrowed)} XLM · placed{" "}
                {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {order.status}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                disabled={isCancelling}
                onClick={() => cancelMutation.mutate(order.id)}
                aria-label={`Cancel order for ${order.fraction_amount} fractions`}
                data-testid={`cancel-order-${order.id}`}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <X className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Main panel ─────────────────────────────────────────────────────────────

interface LimitOrderPanelProps {
  invoiceId: string;
  walletAddress: string | null | undefined;
}

export function LimitOrderPanel({ invoiceId, walletAddress }: LimitOrderPanelProps) {
  return (
    <div className="space-y-6" data-testid="limit-order-panel">
      {/* Placement form */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          New limit order
        </h3>
        {walletAddress ? (
          <LimitOrderForm invoiceId={invoiceId} />
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="limit-order-connect-prompt">
            Connect a wallet to place a limit order.
          </p>
        )}
      </div>

      <Separator />

      {/* Active orders */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Your active orders
        </h3>
        <ActiveOrdersList walletAddress={walletAddress} />
      </div>
    </div>
  );
}
