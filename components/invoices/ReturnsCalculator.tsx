"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Money } from "@/components/currency";
import {
  DEFAULT_FRACTION_PRICE,
  calculateReturns,
  daysUntil,
  parseAmount,
} from "@/lib/returnsCalculator";

export const RETURNS_METHODOLOGY =
  "Your amount buys whole fractions at the current fraction price. Your pro-rata share is the fractions you hold divided by the invoice's total fractions. Projected yield is the amount invested × the invoice yield rate × days to maturity ÷ 365, before platform fees.";

interface ReturnsCalculatorProps {
  faceValue: number;
  yieldPercentage?: number | null;
  maturityDate: string;
  fractionPrice?: number;
}

export function ReturnsCalculator({
  faceValue,
  yieldPercentage,
  maturityDate,
  fractionPrice = DEFAULT_FRACTION_PRICE,
}: ReturnsCalculatorProps) {
  const [raw, setRaw] = useState("");
  const daysRemaining = daysUntil(maturityDate);
  const result = calculateReturns({
    amount: parseAmount(raw),
    fractionPrice,
    faceValue,
    yieldPercentage: yieldPercentage ?? 0,
    daysRemaining,
  });

  return (
    <div className="space-y-3 border-t pt-4" data-testid="returns-calculator">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-semibold">Returns calculator</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="How returns are calculated"
                data-testid="returns-methodology-trigger"
                className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" data-testid="returns-methodology">
              {RETURNS_METHODOLOGY}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="returns-calc-amount">Amount to invest (XLM)</Label>
        <Input
          id="returns-calc-amount"
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="0"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          data-testid="returns-amount-input"
        />
      </div>

      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Fractions</dt>
          <dd className="font-medium tabular-nums" data-testid="returns-fractions">
            {result.fractionCount.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Share of supply</dt>
          <dd className="font-medium tabular-nums" data-testid="returns-share">
            {result.shareOfSupply.toFixed(2)}%
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Yield at maturity</dt>
          <dd className="font-medium tabular-nums" data-testid="returns-yield">
            <Money xlm={result.projectedYield} xlmText={`${result.projectedYield.toFixed(2)} XLM`} />
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">{daysRemaining} days to maturity</p>
    </div>
  );
}
