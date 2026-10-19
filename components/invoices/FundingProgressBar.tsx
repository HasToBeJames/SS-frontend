"use client";

import { useEffect, useState } from "react";
import { Money } from "@/components/currency";

interface FundingProgressBarProps {
    /** Amount raised so far. The API may omit it for a brand new invoice. */
    raised: number | null | undefined;
    /** Maximum funding cap. The bar fills against this amount. */
    target: number;
    investorCount: number;
    /**
     * Minimum amount the invoice must raise to proceed (#462). When set, a
     * marker is drawn on the bar and a "Minimum met" badge appears once it is
     * crossed. Values outside (0, target) are ignored because a marker at
     * either end of the bar tells the investor nothing.
     */
    minThreshold?: number | null;
}

function formatAmount(amount: number) {
    return amount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

export type FundingThresholdState = "below_min" | "min_met" | "fully_funded";

/**
 * Where an invoice sits relative to its minimum threshold and maximum cap.
 *
 * Kept free of React so the badge rules are tested directly. Without a usable
 * minimum, an invoice is either fully funded or below the cap.
 */
export function fundingThresholdState(
    raised: number,
    target: number,
    minThreshold?: number | null
): FundingThresholdState {
    if (target > 0 && raised >= target) return "fully_funded";
    const min = usableMinThreshold(minThreshold, target);
    if (min !== null && raised >= min) return "min_met";
    return "below_min";
}

function usableMinThreshold(minThreshold: number | null | undefined, target: number): number | null {
    if (minThreshold == null || !Number.isFinite(minThreshold)) return null;
    return minThreshold > 0 && minThreshold < target ? minThreshold : null;
}

export function FundingProgressBar({ raised, target, investorCount, minThreshold }: FundingProgressBarProps) {
    const [animatedWidth, setAnimatedWidth] = useState(0);

    // A missing raised value means nothing has been committed yet, not a crash.
    const raisedAmount = raised ?? 0;
    const percentage = target > 0 ? Math.min((raisedAmount / target) * 100, 100) : 0;
    const min = usableMinThreshold(minThreshold, target);
    const minPercentage = min !== null ? (min / target) * 100 : null;
    const state = fundingThresholdState(raisedAmount, target, min);
    const isFullyFunded = state === "fully_funded";

    useEffect(() => {
        // Animate from the previous width to the latest percentage after render.
        const timer = setTimeout(() => {
            setAnimatedWidth(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    const barColor = isFullyFunded
        ? "bg-green-500"
        : state === "min_met"
          ? "bg-blue-500"
          : "bg-primary";

    return (
        <div className="space-y-4">
            <div>
                <div className="mb-2 flex justify-between text-sm">
                    <span>Raised</span>
                    <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="relative">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                            data-testid="funding-progress-bar"
                            role="progressbar"
                            aria-valuenow={Math.round(percentage)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuetext={
                                min !== null
                                    ? `${formatAmount(raisedAmount)} XLM raised; minimum ${formatAmount(min)} XLM, cap ${formatAmount(target)} XLM`
                                    : undefined
                            }
                            className={`h-full transition-all duration-1000 ease-out ${barColor}`}
                            style={{ width: `${animatedWidth}%` }}
                        />
                    </div>
                    {minPercentage !== null && (
                        <div
                            data-testid="funding-min-marker"
                            aria-hidden="true"
                            title={`Minimum threshold: ${formatAmount(min!)} XLM`}
                            className="absolute -top-1 h-5 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
                            style={{ left: `${minPercentage}%` }}
                        />
                    )}
                </div>
            </div>
            {min !== null && (
                <dl
                    className="grid grid-cols-3 gap-2 text-xs"
                    data-testid="funding-threshold-labels"
                >
                    <div>
                        <dt className="text-muted-foreground">Raised</dt>
                        <dd className="font-semibold" data-testid="funding-label-raised">
                            <Money xlm={raisedAmount} xlmText={`${formatAmount(raisedAmount)} XLM`} />
                        </dd>
                    </div>
                    <div className="text-center">
                        <dt className="text-muted-foreground">Min threshold</dt>
                        <dd className="font-semibold" data-testid="funding-label-min">
                            <Money xlm={min} xlmText={`${formatAmount(min)} XLM`} />
                        </dd>
                    </div>
                    <div className="text-right">
                        <dt className="text-muted-foreground">Max cap</dt>
                        <dd className="font-semibold" data-testid="funding-label-max">
                            <Money xlm={target} xlmText={`${formatAmount(target)} XLM`} />
                        </dd>
                    </div>
                </dl>
            )}
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    <Money xlm={raisedAmount} xlmText={`${formatAmount(raisedAmount)} XLM`} /> of <Money xlm={target} xlmText={`${formatAmount(target)} XLM`} />
                </p>
                <div className="flex items-center gap-2">
                    {isFullyFunded && (
                        <span
                            data-testid="funding-badge-fully-funded"
                            className="inline-flex items-center rounded-full border border-transparent bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800"
                        >
                            Fully funded
                        </span>
                    )}
                    {state === "min_met" && (
                        <span
                            data-testid="funding-badge-min-met"
                            className="inline-flex items-center rounded-full border border-transparent bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800"
                        >
                            Minimum met
                        </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {investorCount} {investorCount === 1 ? "investor" : "investors"}
                    </span>
                </div>
            </div>
        </div>
    );
}
