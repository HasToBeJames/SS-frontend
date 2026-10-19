/**
 * Pro-rata returns maths for the invoice detail calculator (#501).
 *
 * An investment buys whole fractions at the current fraction price. Its share
 * of the invoice is fractions held over total fractions, and the projected
 * yield accrues simple interest on the amount actually invested for the days
 * left until maturity.
 */

export const DAYS_PER_YEAR = 365;
export const DEFAULT_FRACTION_PRICE = 1;
const MS_PER_DAY = 86_400_000;

export interface ReturnsInputs {
  /** Hypothetical investment in XLM. */
  amount: number;
  /** Price of one fraction in XLM. */
  fractionPrice: number;
  /** Face value of the whole invoice in XLM. */
  faceValue: number;
  /** Annualised yield in percent. */
  yieldPercentage: number;
  /** Whole days left until maturity. */
  daysRemaining: number;
}

export interface ReturnsResult {
  fractionCount: number;
  totalFractions: number;
  /** Percentage of the total supply held, 0-100. */
  shareOfSupply: number;
  /** Amount actually spent on whole fractions. */
  investedAmount: number;
  projectedYield: number;
  projectedPayout: number;
}

function positive(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function daysUntil(date: string | null | undefined, now: number = Date.now()): number {
  if (!date) return 0;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - now) / MS_PER_DAY));
}

export function parseAmount(raw: string): number {
  return positive(Number(raw));
}

export function calculateReturns(inputs: ReturnsInputs): ReturnsResult {
  const price = positive(inputs.fractionPrice) || DEFAULT_FRACTION_PRICE;
  const totalFractions = Math.floor(positive(inputs.faceValue) / price);
  const fractionCount = Math.floor(positive(inputs.amount) / price);
  const investedAmount = fractionCount * price;
  const shareOfSupply = totalFractions > 0 ? (fractionCount / totalFractions) * 100 : 0;
  const projectedYield =
    investedAmount *
    (positive(inputs.yieldPercentage) / 100) *
    (positive(inputs.daysRemaining) / DAYS_PER_YEAR);

  return {
    fractionCount,
    totalFractions,
    shareOfSupply,
    investedAmount,
    projectedYield,
    projectedPayout: investedAmount + projectedYield,
  };
}
