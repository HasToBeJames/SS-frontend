import { describe, it, expect } from "vitest";
import { formatBpsDiff, getYieldBenchmark, MIN_BENCHMARK_SAMPLE } from "../benchmark";

const bench = (avg: number | null, sample = 10) => ({ sector_avg_yield: avg, sample_size: sample });

describe("getYieldBenchmark (#530)", () => {
  it("rates a yield well above the sector average as above", () => {
    expect(getYieldBenchmark({ yield_percentage: 10, sector_benchmark: bench(8) })).toEqual({
      rating: "above",
      sectorAvgYield: 8,
      diffBps: 200,
    });
  });

  it("rates a yield well below the sector average as below", () => {
    const result = getYieldBenchmark({ yield_percentage: 6.5, sector_benchmark: bench(8) });
    expect(result?.rating).toBe("below");
    expect(result?.diffBps).toBe(-150);
  });

  it("rates a yield within 25 bps of the average as avg", () => {
    expect(getYieldBenchmark({ yield_percentage: 8.2, sector_benchmark: bench(8) })?.rating).toBe("avg");
    expect(getYieldBenchmark({ yield_percentage: 8.25, sector_benchmark: bench(8) })?.rating).toBe("avg");
    expect(getYieldBenchmark({ yield_percentage: 7.75, sector_benchmark: bench(8) })?.rating).toBe("avg");
    expect(getYieldBenchmark({ yield_percentage: 8.26, sector_benchmark: bench(8) })?.rating).toBe("above");
  });

  it("returns null when benchmark data is missing or insufficient", () => {
    expect(getYieldBenchmark({ yield_percentage: 10 })).toBeNull();
    expect(getYieldBenchmark({ yield_percentage: 10, sector_benchmark: null })).toBeNull();
    expect(getYieldBenchmark({ yield_percentage: 10, sector_benchmark: bench(null) })).toBeNull();
    expect(
      getYieldBenchmark({ yield_percentage: 10, sector_benchmark: bench(8, MIN_BENCHMARK_SAMPLE - 1) }),
    ).toBeNull();
    expect(getYieldBenchmark({ sector_benchmark: bench(8) })).toBeNull();
  });
});

describe("formatBpsDiff", () => {
  it("signs the difference", () => {
    expect(formatBpsDiff(200)).toBe("+200 bps");
    expect(formatBpsDiff(-150)).toBe("-150 bps");
    expect(formatBpsDiff(0)).toBe("0 bps");
  });
});
