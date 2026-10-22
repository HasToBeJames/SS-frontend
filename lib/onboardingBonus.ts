import type { OnboardingBonus } from "@/lib/api";

export const DEFAULT_BONUS_YIELD_BPS = 50;

/** The chip shows only for a known wallet that has not yet claimed the bonus. */
export function isBonusAvailable(bonus: OnboardingBonus | null | undefined): boolean {
  return Boolean(bonus) && bonus!.is_claimed === false;
}

export function bonusYieldPercent(bonus: OnboardingBonus): number {
  return (bonus.bonus_yield_bps ?? DEFAULT_BONUS_YIELD_BPS) / 100;
}
