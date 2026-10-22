/** Issuer reputation tiers (#490). Thresholds are inclusive bounds. */

export type ReputationTierId = "unrated" | "bronze" | "silver" | "gold" | "platinum";

export interface ReputationTier {
  id: ReputationTierId;
  label: string;
  min: number;
  max: number;
  /** Tailwind classes for the badge surface and icon. */
  className: string;
}

export const REPUTATION_TIERS: ReputationTier[] = [
  { id: "bronze", label: "Bronze", min: 0, max: 39, className: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200" },
  { id: "silver", label: "Silver", min: 40, max: 59, className: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" },
  { id: "gold", label: "Gold", min: 60, max: 79, className: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" },
  { id: "platinum", label: "Platinum", min: 80, max: 100, className: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200" },
];

export const UNRATED_TIER: ReputationTier = {
  id: "unrated",
  label: "Unrated",
  min: 0,
  max: 0,
  className: "border-border bg-muted text-muted-foreground",
};

export function getReputationTier(score: number | null | undefined): ReputationTier {
  if (score === null || score === undefined || Number.isNaN(score)) return UNRATED_TIER;
  const rounded = Math.round(Math.min(100, Math.max(0, score)));
  return (
    REPUTATION_TIERS.find((t) => rounded >= t.min && rounded <= t.max) ??
    REPUTATION_TIERS[REPUTATION_TIERS.length - 1]
  );
}

const EVENT_LABELS: Record<string, string> = {
  settled_on_time: "Settled on time",
  settled_late: "Settled late",
  defaulted: "Defaulted",
  invoice_funded: "Invoice fully funded",
  kyc_verified: "KYC verified",
};

export function formatReputationEvent(eventType: string): string {
  if (EVENT_LABELS[eventType]) return EVENT_LABELS[eventType];
  const spaced = eventType.replace(/[_-]+/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "Event";
}

/** Newest first; invalid dates sink to the end. */
export function sortReputationHistory<T extends { date: string }>(history: T[]): T[] {
  const time = (d: string) => {
    const t = new Date(d).getTime();
    return Number.isNaN(t) ? -Infinity : t;
  };
  return [...history].sort((a, b) => time(b.date) - time(a.date));
}
