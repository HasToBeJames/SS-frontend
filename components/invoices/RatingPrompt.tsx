"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubmitInvoiceRatingMutation } from "@/hooks/useInvoiceRating";
import type { InvoiceRatingSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

/** 5-star input with hover preview. */
export function StarRatingInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value || 0;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Star rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          data-testid={`rating-prompt-star-${star}`}
          onMouseEnter={() => setHover(star)}
          onFocus={() => setHover(star)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(star)}
          className="rounded p-1 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-8 w-8 transition-colors",
              star <= shown ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

/** Per-star distribution bars for the aggregate rating. */
export function RatingDistribution({ summary }: { summary: InvoiceRatingSummary }) {
  if (!summary.distribution) return null;
  return (
    <div className="space-y-1" data-testid="rating-distribution">
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const count = summary.distribution![star] ?? 0;
        const pct = summary.rating_count > 0 ? (count / summary.rating_count) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-6 text-muted-foreground">{star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${pct}%` }}
                data-testid={`rating-distribution-${star}`}
              />
            </div>
            <span className="w-8 text-right text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Post-settlement prompt asking an investor to rate an invoice they held.
 */
export function RatingPromptModal({
  invoiceId,
  invoiceTitle,
  walletAddress,
  open,
  onOpenChange,
}: {
  invoiceId: string;
  invoiceTitle: string;
  walletAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const mutation = useSubmitInvoiceRatingMutation(invoiceId);

  const submit = () => {
    if (!selected) return;
    mutation.mutate(
      { rating: selected, walletAddress },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="rating-prompt-modal">
        <DialogHeader>
          <DialogTitle>Rate {invoiceTitle}</DialogTitle>
          <DialogDescription>
            This invoice has settled. How would you rate it?
          </DialogDescription>
        </DialogHeader>
        <StarRatingInput value={selected} onChange={setSelected} />
        <Button
          data-testid="rating-prompt-submit"
          disabled={!selected || mutation.isPending}
          onClick={submit}
        >
          {mutation.isPending ? "Submitting..." : "Submit rating"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
