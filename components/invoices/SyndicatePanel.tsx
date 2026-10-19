"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoiceSyndicate, useSyndicateMutation } from "@/hooks/useSyndicate";
import { useWallet } from "@/context/WalletContext";
import type { Syndicate } from "@/lib/api";
import { isTargetMet, syndicateGap, validateCoInvestAmount } from "@/lib/syndicate";
import { truncateAddress } from "@/lib/stellar";

function formatAmount(value: number): string {
  return `${value.toLocaleString()} XLM`;
}

function CreateSyndicateForm({ invoiceId, wallet }: { invoiceId: string; wallet: string }) {
  const [minCoInvest, setMinCoInvest] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useSyndicateMutation(invoiceId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(minCoInvest);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a minimum co-investment greater than 0.");
      return;
    }
    setError(null);
    mutation.mutate({ method: "create_syndicate", wallet, min_co_invest: value });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="create-syndicate-panel">
      <h3 className="font-medium">Create a syndicate</h3>
      <p className="text-sm text-muted-foreground">
        Lead this funding round and set the smallest amount a co-investor can commit.
      </p>
      <div className="space-y-1">
        <Label htmlFor="syndicate-min-co-invest">Minimum co-investment (XLM)</Label>
        <Input
          id="syndicate-min-co-invest"
          type="number"
          min="0"
          step="any"
          value={minCoInvest}
          onChange={(e) => setMinCoInvest(e.target.value)}
          data-testid="syndicate-min-input"
        />
        {error && (
          <p className="text-sm text-destructive" role="alert" data-testid="syndicate-create-error">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={mutation.isPending} data-testid="create-syndicate-submit">
        {mutation.isPending ? "Creating..." : "Create syndicate"}
      </Button>
    </form>
  );
}

function JoinSyndicateForm({
  invoiceId,
  wallet,
  syndicate,
}: {
  invoiceId: string;
  wallet: string;
  syndicate: Syndicate;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useSyndicateMutation(invoiceId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    const validation = validateCoInvestAmount(value, syndicate.min_co_invest);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    mutation.mutate({ method: "join_syndicate", wallet, amount: value });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="join-syndicate-panel">
      <h3 className="font-medium">Join this syndicate</h3>
      <div className="space-y-1">
        <Label htmlFor="syndicate-join-amount">
          Amount (minimum {formatAmount(syndicate.min_co_invest)})
        </Label>
        <Input
          id="syndicate-join-amount"
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          data-testid="syndicate-join-input"
        />
        {error && (
          <p className="text-sm text-destructive" role="alert" data-testid="syndicate-join-error">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={mutation.isPending} data-testid="join-syndicate-submit">
        {mutation.isPending ? "Joining..." : "Join syndicate"}
      </Button>
    </form>
  );
}

function ActiveSyndicateCard({
  invoiceId,
  syndicate,
  wallet,
}: {
  invoiceId: string;
  syndicate: Syndicate;
  wallet: string | null;
}) {
  const mutation = useSyndicateMutation(invoiceId);
  const gap = syndicateGap(syndicate);
  const isLead = wallet !== null && syndicate.lead === wallet;
  const isMember =
    wallet !== null && !isLead && syndicate.members.some((m) => m.address === wallet);
  const canExecute = isLead && syndicate.status === "open" && isTargetMet(syndicate);

  return (
    <div className="space-y-3 rounded-lg border p-4" data-testid="active-syndicate-card">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Committed</p>
          <p className="font-semibold" data-testid="syndicate-committed">
            {formatAmount(syndicate.committed)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Members</p>
          <p className="font-semibold" data-testid="syndicate-member-count">
            {syndicate.members.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Target</p>
          <p className="font-semibold">{formatAmount(syndicate.target)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Remaining to target</p>
          <p className="font-semibold" data-testid="syndicate-gap">
            {formatAmount(gap)}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Lead investor: <span className="font-mono">{truncateAddress(syndicate.lead)}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {isMember && syndicate.status === "open" && (
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ method: "exit_syndicate", wallet: wallet as string })}
            data-testid="exit-syndicate-button"
          >
            Exit syndicate
          </Button>
        )}
        {canExecute && (
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({ method: "execute_syndicate", wallet: wallet as string })
            }
            data-testid="execute-syndicate-button"
          >
            Execute syndicate
          </Button>
        )}
      </div>
    </div>
  );
}

export function SyndicatePanel({ invoiceId }: { invoiceId: string }) {
  const { address, isConnected } = useWallet();
  const { data, isLoading } = useInvoiceSyndicate(invoiceId);

  if (isLoading) return <Skeleton className="h-32 w-full" data-testid="syndicate-loading" />;
  if (!data?.eligible) return null;

  const syndicate = data.syndicate;
  const isMemberOrLead =
    !!syndicate &&
    !!address &&
    (syndicate.lead === address || syndicate.members.some((m) => m.address === address));

  return (
    <Card data-testid="syndicate-tab">
      <CardHeader>
        <h2 className="text-lg font-semibold">Syndicate</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {syndicate && (
          <ActiveSyndicateCard invoiceId={invoiceId} syndicate={syndicate} wallet={address} />
        )}

        {!isConnected || !address ? (
          <p className="text-sm text-muted-foreground">
            Connect a wallet to create or join a syndicate.
          </p>
        ) : !syndicate ? (
          <CreateSyndicateForm invoiceId={invoiceId} wallet={address} />
        ) : syndicate.status === "open" && !isMemberOrLead ? (
          <JoinSyndicateForm invoiceId={invoiceId} wallet={address} syndicate={syndicate} />
        ) : null}
      </CardContent>
    </Card>
  );
}
