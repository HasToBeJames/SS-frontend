"use client";

import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  invoiceId: string;
  className?: string;
  /** Render "Watch"/"Watching" beside the bell instead of icon-only. */
  showLabel?: boolean;
}

/**
 * Bell toggle for the watchlist (#474).
 *
 * Wired to `useWatchlist`, so clicking flips the bell optimistically and the
 * hook rolls it back if the registry call fails. Without a connected wallet
 * there is no registry row to write, so the control is disabled and explains
 * why on hover rather than failing silently.
 */
export function WatchlistButton({
  invoiceId,
  className,
  showLabel = false,
}: WatchlistButtonProps) {
  const { isConnected } = useStellarWallet();
  const { isWatched, isPending, toggle } = useWatchlist();

  const watched = isWatched(invoiceId);
  const pending = isPending(invoiceId);
  const disabled = !isConnected || pending;
  const label = watched ? "Remove from watchlist" : "Add to watchlist";
  const title = !isConnected
    ? "Connect your wallet to watch invoices"
    : label;

  if (showLabel) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggle(invoiceId)}
        disabled={disabled}
        aria-pressed={watched}
        aria-label={label}
        title={title}
        data-testid={`watchlist-toggle-${invoiceId}`}
        data-watched={watched}
        className={className}
      >
        {watched ? (
          <BellRing className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bell className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{watched ? "Watching" : "Watch"}</span>
      </Button>
    );
  }

  return (
    <Button
      variant={watched ? "default" : "outline"}
      size="icon"
      onClick={() => toggle(invoiceId)}
      disabled={disabled}
      aria-pressed={watched}
      aria-label={label}
      title={title}
      data-testid={`watchlist-toggle-${invoiceId}`}
      data-watched={watched}
      className={cn(className)}
    >
      {watched ? (
        <BellRing className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Bell className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
