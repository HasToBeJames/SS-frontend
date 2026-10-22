"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchExtensionProposal,
  proposeExtension,
  voteOnExtension,
  type ExtensionProposal,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const extensionProposalQueryKey = (invoiceId: string) =>
  ["extension-proposal", invoiceId] as const;

/** An invoice is overdue once it is funded and its maturity date has passed. */
export function isInvoiceOverdue(status: string, maturityDate?: string | null): boolean {
  return status === "funded" && !!maturityDate && isPast(new Date(maturityDate));
}

interface ExtensionProposalSectionProps {
  invoiceId: string;
  maturityDate?: string | null;
  isOverdue: boolean;
  isIssuer: boolean;
  /** Connected wallet's holding in this invoice; 0 when not a holder. */
  holderWeight: number;
  walletAddress?: string | null;
}

/**
 * Maturity extension governance for overdue invoices: the issuer proposes a
 * new maturity date and holders vote, weighted by their position.
 */
export function ExtensionProposalSection({
  invoiceId,
  maturityDate,
  isOverdue,
  isIssuer,
  holderWeight,
  walletAddress,
}: ExtensionProposalSectionProps) {
  const { data: proposal, isLoading } = useQuery({
    queryKey: extensionProposalQueryKey(invoiceId),
    queryFn: () => fetchExtensionProposal(invoiceId),
  });

  const executed = proposal?.status === "executed";
  if (!isOverdue && !executed) return null;
  if (isLoading) return null;

  return (
    <section className="space-y-4" data-testid="extension-proposal-section">
      <h2 className="text-lg font-semibold">Extension Proposal</h2>

      {executed && proposal ? (
        <ExtensionExecutedBanner newMaturityDate={proposal.proposed_maturity_date} />
      ) : proposal?.status === "active" ? (
        <ActiveProposalCard
          proposal={proposal}
          holderWeight={holderWeight}
          walletAddress={walletAddress}
        />
      ) : isIssuer ? (
        <ProposeExtensionPanel invoiceId={invoiceId} maturityDate={maturityDate} />
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="no-extension-proposal">
          No extension has been proposed for this invoice.
        </p>
      )}
    </section>
  );
}

export function ExtensionExecutedBanner({ newMaturityDate }: { newMaturityDate: string }) {
  return (
    <div
      role="status"
      data-testid="extension-executed-banner"
      className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="text-sm">
        <span className="font-semibold">Extension executed.</span> New maturity date:{" "}
        <span className="font-semibold" data-testid="extension-new-maturity">
          {format(new Date(newMaturityDate), "PPP")}
        </span>
      </p>
    </div>
  );
}

function ProposeExtensionPanel({
  invoiceId,
  maturityDate,
}: {
  invoiceId: string;
  maturityDate?: string | null;
}) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const base = Math.max(Date.now(), maturityDate ? new Date(maturityDate).getTime() : 0);
  const minDate = new Date(base + 86_400_000).toISOString().slice(0, 10);

  const mutation = useMutation({
    mutationFn: () =>
      proposeExtension(invoiceId, { proposed_maturity_date: date, reason: reason.trim() }),
    onSuccess: (proposal) => {
      queryClient.setQueryData(extensionProposalQueryKey(invoiceId), proposal);
      toast.success("Extension proposed");
    },
  });

  return (
    <Card data-testid="propose-extension-panel">
      <CardHeader>
        <h3 className="font-semibold">Propose Extension</h3>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="extension-maturity-date">New maturity date</Label>
            <Input
              id="extension-maturity-date"
              type="date"
              min={minDate}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extension-reason">Reason</Label>
            <Textarea
              id="extension-reason"
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the maturity should be extended"
            />
          </div>
          <Button
            type="submit"
            data-testid="extension-submit"
            disabled={mutation.isPending || !date || date < minDate || !reason.trim()}
          >
            {mutation.isPending ? "Submitting..." : "Submit proposal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ActiveProposalCard({
  proposal,
  holderWeight,
  walletAddress,
}: {
  proposal: ExtensionProposal;
  holderWeight: number;
  walletAddress?: string | null;
}) {
  const [voteOpen, setVoteOpen] = useState(false);
  const cast = proposal.votes_for + proposal.votes_against;
  const forPct = cast > 0 ? (proposal.votes_for / cast) * 100 : 0;
  const quorumPct = proposal.quorum > 0 ? Math.min(100, (cast / proposal.quorum) * 100) : 0;
  const ended = isPast(new Date(proposal.ends_at));
  const canVote = !!walletAddress && holderWeight > 0 && !ended;

  return (
    <Card data-testid="active-extension-proposal">
      <CardHeader>
        <h3 className="flex items-center gap-2 font-semibold">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
          Proposed maturity: {format(new Date(proposal.proposed_maturity_date), "PPP")}
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{proposal.reason}</p>

        <div data-testid="extension-vote-tally">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-emerald-600">For {proposal.votes_for.toLocaleString()}</span>
            <span className="text-red-600">Against {proposal.votes_against.toLocaleString()}</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-emerald-500" style={{ width: `${forPct}%` }} />
            <div className="bg-red-500" style={{ width: `${cast > 0 ? 100 - forPct : 0}%` }} />
          </div>
        </div>

        <div data-testid="extension-quorum">
          <div className="mb-1 flex justify-between text-sm">
            <span>Quorum</span>
            <span>
              {cast.toLocaleString()} / {proposal.quorum.toLocaleString()} ({quorumPct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${quorumPct}%` }} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground" data-testid="extension-time-remaining">
          {ended
            ? "Voting has ended"
            : `${formatDistanceToNowStrict(new Date(proposal.ends_at))} remaining`}
        </p>

        {canVote && (
          <Button data-testid="extension-vote-open" onClick={() => setVoteOpen(true)}>
            Vote
          </Button>
        )}
      </CardContent>

      {canVote && (
        <VoteModal
          open={voteOpen}
          onOpenChange={setVoteOpen}
          proposal={proposal}
          holderWeight={holderWeight}
          walletAddress={walletAddress!}
        />
      )}
    </Card>
  );
}

function VoteModal({
  open,
  onOpenChange,
  proposal,
  holderWeight,
  walletAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: ExtensionProposal;
  holderWeight: number;
  walletAddress: string;
}) {
  const queryClient = useQueryClient();
  const [support, setSupport] = useState<boolean | null>(null);
  const share = proposal.total_weight > 0 ? (holderWeight / proposal.total_weight) * 100 : 0;

  const mutation = useMutation({
    mutationFn: () => voteOnExtension(proposal.id, { wallet: walletAddress, support: !!support }),
    onSuccess: (updated) => {
      queryClient.setQueryData(extensionProposalQueryKey(proposal.invoice_id), updated);
      toast.success("Vote submitted");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="extension-vote-modal">
        <DialogHeader>
          <DialogTitle>Vote on extension</DialogTitle>
          <DialogDescription>
            Extend maturity to {format(new Date(proposal.proposed_maturity_date), "PPP")}?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Vote">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              role="radio"
              aria-checked={support === value}
              data-testid={value ? "extension-vote-for" : "extension-vote-against"}
              onClick={() => setSupport(value)}
              className={cn(
                "rounded-md border py-3 text-sm font-medium transition-colors",
                support === value
                  ? value
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-red-500 bg-red-500 text-white"
                  : "hover:bg-muted"
              )}
            >
              {value ? "For" : "Against"}
            </button>
          ))}
        </div>

        <p className="text-sm" data-testid="extension-vote-weight">
          Estimated weight:{" "}
          <span className="font-semibold">
            {holderWeight.toLocaleString()} ({share.toFixed(2)}%)
          </span>
        </p>

        <Button
          data-testid="extension-vote-submit"
          disabled={support === null || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Submitting..." : "Submit vote"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
