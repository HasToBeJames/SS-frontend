"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePoolSubscription } from "@/hooks/usePoolSubscription";
import type { PoolSubscription, PoolSubscriptionInterval } from "@/lib/api";
import {
  POOL_SUBSCRIPTION_INTERVALS,
  POOL_SUBSCRIPTION_INTERVAL_LABELS,
  nextExecutionDate,
  projectedAnnualInvestment,
  validateSubscriptionAmount,
} from "@/lib/poolSubscriptions";
import { cn } from "@/lib/utils";

function formatXlm(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`;
}

function formatDateOrDash(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy");
}

function ActiveSubscriptionCard({
  subscription,
  onCancel,
  isCancelling,
}: {
  subscription: PoolSubscription;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  return (
    <Card data-testid="pool-subscription-active">
      <CardHeader>
        <h3 className="text-base font-semibold">Active subscription</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Investing</dt>
            <dd className="font-medium" data-testid="pool-subscription-config">
              {formatXlm(subscription.amount)} · {POOL_SUBSCRIPTION_INTERVAL_LABELS[subscription.interval]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Next execution</dt>
            <dd className="font-medium" data-testid="pool-subscription-next-execution">
              {formatDateOrDash(subscription.next_execution_at)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total invested to date</dt>
            <dd className="font-medium tabular-nums" data-testid="pool-subscription-total">
              {formatXlm(subscription.total_invested)}
            </dd>
          </div>
        </dl>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isCancelling}
          data-testid="pool-subscription-cancel"
        >
          {isCancelling ? "Cancelling..." : "Cancel subscription"}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Subscribe tab of the pool invest panel (#544). Sets up a recurring investment
 * with `create_subscription`, or shows the active subscription with a
 * `cancel_subscription` action.
 */
export function PoolSubscriptionPanel({ poolId }: { poolId: string }) {
  const { subscription, isLoading, isError, isConnected, create, cancel } =
    usePoolSubscription(poolId);
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<PoolSubscriptionInterval>("monthly");
  const [submitted, setSubmitted] = useState(false);

  if (!isConnected) {
    return <p className="text-sm text-muted-foreground">Connect a wallet to subscribe.</p>;
  }

  if (isLoading) {
    return <Skeleton className="h-32 w-full" data-testid="pool-subscription-loading" />;
  }

  if (isError) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        Couldn&apos;t load your subscription.
      </p>
    );
  }

  if (subscription?.is_active) {
    return (
      <ActiveSubscriptionCard
        subscription={subscription}
        onCancel={() => cancel.mutate()}
        isCancelling={cancel.isPending}
      />
    );
  }

  const validation = validateSubscriptionAmount(amount);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!validation.valid || validation.amount === null) return;
    create.mutate(
      { amount: validation.amount, interval: cadence },
      {
        onSuccess: () => {
          setAmount("");
          setSubmitted(false);
        },
      },
    );
  }

  const annual = validation.valid && validation.amount !== null
    ? projectedAnnualInvestment(validation.amount, cadence)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="pool-subscription-form">
      <div className="space-y-1">
        <Label htmlFor="pool-subscription-amount">Amount per execution (XLM)</Label>
        <Input
          id="pool-subscription-amount"
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          data-testid="pool-subscription-amount-input"
        />
        {submitted && validation.error && (
          <p role="alert" className="text-xs text-destructive" data-testid="pool-subscription-amount-error">
            {validation.error}
          </p>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Interval</legend>
        <div className="flex flex-wrap gap-2">
          {POOL_SUBSCRIPTION_INTERVALS.map((option) => {
            const selected = cadence === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setCadence(option)}
                data-testid={`pool-subscription-interval-${option}`}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent",
                )}
              >
                {POOL_SUBSCRIPTION_INTERVAL_LABELS[option]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {validation.valid && annual !== null && (
        <div className="space-y-1 rounded-md bg-muted p-3 text-sm" data-testid="pool-subscription-preview">
          <p>
            Next execution:{" "}
            <span className="font-medium" data-testid="pool-subscription-preview-next">
              {format(nextExecutionDate(cadence, new Date()), "MMM d, yyyy")}
            </span>
          </p>
          <p>
            Projected annual investment:{" "}
            <span className="font-medium tabular-nums" data-testid="pool-subscription-preview-annual">
              {formatXlm(annual)}
            </span>
          </p>
        </div>
      )}

      <Button type="submit" disabled={create.isPending} data-testid="pool-subscription-submit">
        {create.isPending ? "Subscribing..." : "Start subscription"}
      </Button>
    </form>
  );
}
