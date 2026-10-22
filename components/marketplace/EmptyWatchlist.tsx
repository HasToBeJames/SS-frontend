"use client";

import Link from "next/link";
import { Bell, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Empty state for the investor watchlist (#474).
 *
 * A blank list is a dead end, so this pairs a small illustration with the one
 * action that fills it: browsing the marketplace.
 */
export function EmptyWatchlist() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center"
      data-testid="watchlist-empty-state"
    >
      <div className="relative mb-6" aria-hidden="true">
        <svg
          width="140"
          height="112"
          viewBox="0 0 140 112"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="16"
            y="10"
            width="108"
            height="92"
            rx="10"
            className="fill-muted stroke-border"
            strokeWidth="2"
          />
          <rect x="32" y="30" width="52" height="8" rx="4" className="fill-border" />
          <rect x="32" y="48" width="76" height="8" rx="4" className="fill-border" />
          <rect x="32" y="66" width="60" height="8" rx="4" className="fill-border" />
        </svg>
        <span className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 ring-4 ring-card">
          <Bell className="h-5 w-5 text-primary" />
        </span>
      </div>

      <h2 className="text-lg font-semibold">No watched invoices yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Watch invoices you are interested in and they will appear here, with a
        badge whenever one is funded, matures, or settles.
      </p>

      <Button asChild className="mt-6">
        <Link href="/marketplace">
          <Compass className="h-4 w-4" aria-hidden="true" />
          Browse Marketplace
        </Link>
      </Button>
    </div>
  );
}
