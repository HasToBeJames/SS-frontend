"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BENCHMARK_LABELS,
  formatBpsDiff,
  getYieldBenchmark,
  type BenchmarkRating,
} from "@/lib/benchmark";
import type { Invoice } from "@/lib/api";

const RATING_STYLES: Record<BenchmarkRating, string> = {
  above: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  avg: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  below: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
};

/**
 * Compares an invoice's yield with its sector average (#530). Hidden when the
 * sector has too little benchmark data.
 */
export function BenchmarkChip({
  invoice,
}: {
  invoice: Pick<Invoice, "yield_percentage" | "sector_benchmark">;
}) {
  const result = getYieldBenchmark(invoice);
  if (!result) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${RATING_STYLES[result.rating]}`}
            data-testid="benchmark-chip"
            data-rating={result.rating}
          >
            {BENCHMARK_LABELS[result.rating]}
          </span>
        </TooltipTrigger>
        <TooltipContent data-testid="benchmark-chip-tooltip">
          <p>Sector average yield: {result.sectorAvgYield}%</p>
          <p>Difference: {formatBpsDiff(result.diffBps)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
