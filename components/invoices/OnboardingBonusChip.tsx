"use client";

import { Gift } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOnboardingBonus } from "@/hooks/useOnboardingBonus";
import { bonusYieldPercent, isBonusAvailable } from "@/lib/onboardingBonus";

/**
 * "+0.5% bonus yield" chip for wallets that have not yet claimed the one-time
 * onboarding bonus (#529). Renders nothing when the wallet is disconnected,
 * unknown to the backend, or has already claimed.
 */
export function OnboardingBonusChip() {
  const { data: bonus } = useOnboardingBonus();
  if (!bonus || !isBonusAvailable(bonus)) return null;

  const percent = bonusYieldPercent(bonus);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
            data-testid="onboarding-bonus-chip"
          >
            <Gift className="h-3 w-3" aria-hidden="true" />
            +{percent}% bonus yield on first investment
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" data-testid="onboarding-bonus-tooltip">
          <p className="font-medium">One-time onboarding bonus</p>
          <p>
            Your first investment on StellarState earns an extra {percent}% yield. The bonus
            applies once per wallet and is claimed automatically when you invest.
          </p>
          <p>Eligible: connected wallets that have never invested.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
