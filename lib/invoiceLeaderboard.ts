import type { InvoiceLeaderboardEntry, InvoiceLeaderboardMetric } from "@/lib/api";

export const LEADERBOARD_SIZE = 50;

export const LEADERBOARD_METRIC_LABELS: Record<InvoiceLeaderboardMetric, string> = {
  yield_rate: "Yield Rate",
  settlement_speed: "Settlement Speed",
  issuer_reputation: "Issuer Reputation",
};

export function formatLeaderboardValue(metric: InvoiceLeaderboardMetric, value: number): string {
  switch (metric) {
    case "yield_rate":
      return `${value.toFixed(1)}%`;
    case "settlement_speed":
      return `${value.toFixed(1)} days`;
    case "issuer_reputation":
      return `${Math.round(value)}/100`;
  }
}

export interface RankedEntry extends InvoiceLeaderboardEntry {
  position: number;
}

/**
 * Takes the top {@link LEADERBOARD_SIZE} in API order and keeps each entry's
 * platform position, so filtering by sector never renumbers the ranking.
 */
export function rankEntries(
  entries: InvoiceLeaderboardEntry[],
  sector: string | null,
): RankedEntry[] {
  return entries
    .slice(0, LEADERBOARD_SIZE)
    .map((entry, index) => ({ ...entry, position: index + 1 }))
    .filter((entry) => sector === null || entry.sector === sector);
}
