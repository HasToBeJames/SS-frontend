"use client";

import { useInvoiceNav } from "@/hooks/useInvoiceNav";
import {
  compareToNav,
  formatNavPrice,
  isNavStale,
  premiumDiscountLabel,
} from "@/lib/nav";

interface InvoiceNavPanelProps {
  invoiceId: string;
  /**
   * Primary-market price of one fraction, used when the NAV endpoint reports
   * no market price of its own.
   */
  fractionPrice?: number;
}

/**
 * NAV, the current price and the premium or discount between them, for the
 * invest panel on the invoice detail page (#546).
 *
 * Renders nothing when the invoice has no NAV — a panel with an empty NAV row
 * on every invoice the backend has not priced yet would be noise.
 */
export function InvoiceNavPanel({ invoiceId, fractionPrice }: InvoiceNavPanelProps) {
  const { data } = useInvoiceNav(invoiceId);

  const nav = data?.nav_per_fraction ?? null;
  const price = data?.current_price ?? fractionPrice ?? null;
  const comparison = compareToNav(nav, price);
  if (!comparison) return null;

  const stale = isNavStale(data?.computed_at);

  return (
    <div className="rounded-md border p-3" data-testid="invoice-nav-panel">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">NAV per fraction</span>
        <span className="font-medium tabular-nums" data-testid="nav-panel-nav">
          {formatNavPrice(nav)} XLM
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Current price</span>
        <span className="font-medium tabular-nums" data-testid="nav-panel-price">
          {formatNavPrice(price)} XLM
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">vs NAV</span>
        <span className="font-medium tabular-nums" data-testid="nav-panel-bps">
          {premiumDiscountLabel(comparison.premiumBps)}
        </span>
      </div>
      {stale && (
        <p className="mt-2 text-xs text-amber-700" data-testid="nav-panel-stale">
          NAV was computed over an hour ago and may be out of date.
        </p>
      )}
    </div>
  );
}
