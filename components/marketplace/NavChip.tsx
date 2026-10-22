"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInvoiceNav } from "@/hooks/useInvoiceNav";
import {
  compareToNav,
  formatNavPrice,
  isNavStale,
  NAV_POSITION_LABELS,
  premiumDiscountLabel,
  type NavPosition,
} from "@/lib/nav";

const POSITION_STYLES: Record<NavPosition, string> = {
  above: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  at: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  below: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

interface NavChipProps {
  invoiceId: string;
  /**
   * Primary-market price of one fraction, used when the NAV endpoint reports
   * no market price of its own.
   */
  fractionPrice?: number;
}

/**
 * Shows where an invoice's current price sits against its computed NAV
 * (#546): a premium when the price is above NAV, a discount when it is below.
 *
 * Renders nothing when the invoice has no NAV, or no price to compare it
 * with — an empty chip on an unpriced invoice would be noise.
 */
export function NavChip({ invoiceId, fractionPrice }: NavChipProps) {
  const { data } = useInvoiceNav(invoiceId);

  const nav = data?.nav_per_fraction ?? null;
  const price = data?.current_price ?? fractionPrice ?? null;
  const comparison = compareToNav(nav, price);
  if (!comparison) return null;

  const stale = isNavStale(data?.computed_at);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${POSITION_STYLES[comparison.position]}`}
            data-testid="nav-chip"
            data-position={comparison.position}
          >
            {NAV_POSITION_LABELS[comparison.position]}
          </span>
        </TooltipTrigger>
        <TooltipContent data-testid="nav-chip-tooltip">
          <p>NAV per fraction: {formatNavPrice(nav)} XLM</p>
          <p>Current price: {formatNavPrice(price)} XLM</p>
          <p>vs NAV: {premiumDiscountLabel(comparison.premiumBps)}</p>
          {stale && (
            <p className="text-amber-600" data-testid="nav-chip-stale">
              NAV was computed over an hour ago
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
