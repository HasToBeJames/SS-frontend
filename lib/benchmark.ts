import type { Invoice } from "@/lib/api";

export type BenchmarkRating = "above" | "avg" | "below";

export interface YieldBenchmark {
  rating: BenchmarkRating;
  sectorAvgYield: number;
  /** Invoice yield minus sector average, in basis points. */
  diffBps: number;
}

/** Fewer sector invoices than this and the average is too noisy to show. */
export const MIN_BENCHMARK_SAMPLE = 5;

/** Yields within this many bps of the sector average count as "Avg". */
export const AVG_BAND_BPS = 25;

export const BENCHMARK_LABELS: Record<BenchmarkRating, string> = {
  above: "Above Avg",
  avg: "Avg",
  below: "Below Avg",
};

/** Returns `null` when the invoice has no yield or the sector lacks enough data. */
export function getYieldBenchmark(
  invoice: Pick<Invoice, "yield_percentage" | "sector_benchmark">,
): YieldBenchmark | null {
  const benchmark = invoice.sector_benchmark;
  const yieldPct = invoice.yield_percentage;
  if (!benchmark || yieldPct === undefined || yieldPct === null) return null;
  if (benchmark.sector_avg_yield === null || benchmark.sector_avg_yield === undefined) return null;
  if (benchmark.sample_size < MIN_BENCHMARK_SAMPLE) return null;

  const diffBps = Math.round((yieldPct - benchmark.sector_avg_yield) * 100);
  const rating: BenchmarkRating =
    diffBps > AVG_BAND_BPS ? "above" : diffBps < -AVG_BAND_BPS ? "below" : "avg";
  return { rating, sectorAvgYield: benchmark.sector_avg_yield, diffBps };
}

export function formatBpsDiff(diffBps: number): string {
  if (diffBps === 0) return "0 bps";
  return `${diffBps > 0 ? "+" : "-"}${Math.abs(diffBps)} bps`;
}
