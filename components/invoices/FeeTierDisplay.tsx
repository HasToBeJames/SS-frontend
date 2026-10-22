"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFeeTier } from "@/hooks/useFeeTier";
import type { InvestorLoyalty } from "@/lib/api";
import { BadgePercent, Info } from "lucide-react";

const FEE_TOOLTIP = "Platform fee depends on 24h trading volume. Higher volume unlocks a lower fee tier.";

export function FeeTierDisplay({ amount, loyalty }: { amount?: number | null; loyalty?: InvestorLoyalty | null }) {
  const { data, isLoading } = useFeeTier();
  if (isLoading) return <div data-testid="fee-tier-loading" aria-busy="true"><Skeleton className="h-6 w-44" /></div>;
  if (!data) return null;

  const feeAmount = typeof amount === "number" ? (amount * data.fee_percentage) / 100 : null;
  const loyaltyTier = loyalty?.tiers.find((tier) => tier.tier === loyalty.tier);
  const loyaltyDiscount = loyaltyTier?.fee_discount ?? 0;
  const discountedFeeAmount = feeAmount !== null && loyaltyDiscount > 0
    ? feeAmount * (1 - loyaltyDiscount / 100)
    : feeAmount;
  const total = typeof amount === "number" && discountedFeeAmount !== null
    ? amount + discountedFeeAmount
    : null;

  return (
    <div className="space-y-2" data-testid="fee-tier-display">
      <div className="flex items-center gap-2">
        <Badge variant={data.is_lowest_tier ? "default" : "secondary"} data-testid="fee-tier-badge">
          <BadgePercent className="mr-1 size-3.5" />
          Fee {data.fee_percentage}% - {data.tier_label}
        </Badge>
        {loyaltyDiscount > 0 && (
          <Badge variant="secondary" data-testid="loyalty-fee-discount">
            {loyalty?.tier} - {loyaltyDiscount}% loyalty discount
          </Badge>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="inline-flex cursor-help items-center text-muted-foreground" data-testid="fee-tier-tooltip-trigger" aria-label="Show all fee tiers">
              <Info className="size-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72" data-testid="fee-tier-tooltip" title={FEE_TOOLTIP}>
            <p className="mb-2 text-xs text-muted-foreground">{FEE_TOOLTIP}</p>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1 pr-2">Tier</th><th className="py-1 pr-2">Min 24h volume</th><th className="py-1 text-right">Fee</th></tr></thead>
              <tbody>{data.tiers.map((tier) => <tr key={tier.tier} className={tier.tier === data.tier_label ? "font-semibold" : undefined}><td className="py-1 pr-2">{tier.tier}</td><td className="py-1 pr-2">{tier.min_volume.toLocaleString()} XLM</td><td className="py-1 text-right">{tier.fee_percentage}%</td></tr>)}</tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">24h volume: {data.volume_24h.toLocaleString()} XLM</p>
          </PopoverContent>
        </Popover>
      </div>
      {typeof amount === "number" && feeAmount !== null && discountedFeeAmount !== null && total !== null && (
        <div className="space-y-1 text-xs text-muted-foreground" data-testid="fee-cost-breakdown">
          <div className="flex justify-between"><span>Investment</span><span>{amount.toLocaleString()} XLM</span></div>
          <div className="flex justify-between"><span>{loyaltyDiscount > 0 ? `Standard fee (${data.fee_percentage}%)` : `Fee (${data.fee_percentage}%)`}</span><span>{feeAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM</span></div>
          {loyaltyDiscount > 0 && (<><div className="flex justify-between"><span>Loyalty discount</span><span>-{loyaltyDiscount}%</span></div><div className="flex justify-between"><span>Final fee</span><span>{discountedFeeAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM</span></div></>)}
          <div className="flex justify-between font-semibold text-foreground"><span>Total</span><span>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM</span></div>
        </div>
      )}
    </div>
  );
}