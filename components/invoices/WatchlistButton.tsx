"use client";

import { WatchlistButton as BaseWatchlistButton } from "@/components/marketplace/WatchlistButton";

interface WatchlistButtonProps {
  invoiceId: string;
  className?: string;
}

/**
 * Invoice-detail variant of the watchlist bell (#474).
 *
 * The detail header has room for copy, so this renders the labelled form of
 * the shared button. Both surfaces share one registry-backed hook, so the
 * detail page and the watchlist page can never disagree about what is watched.
 */
export function WatchlistButton({ invoiceId, className }: WatchlistButtonProps) {
  return (
    <BaseWatchlistButton
      invoiceId={invoiceId}
      className={className}
      showLabel
    />
  );
}
