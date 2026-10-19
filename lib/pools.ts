import type { PoolInvoice } from "@/lib/api";

/** Weighted average yield of a basket, in percent. */
export function weightedAverageYield(invoices: PoolInvoice[]): number {
  const totalWeight = invoices.reduce((sum, inv) => sum + inv.weight, 0);
  if (totalWeight <= 0) return 0;
  return (
    invoices.reduce((sum, inv) => sum + inv.yield_percentage * inv.weight, 0) /
    totalWeight
  );
}

export interface PoolAllocation {
  invoice_id: string;
  name: string;
  amount: number;
}

/**
 * Splits `amount` across the basket pro rata by weight, in whole cents.
 * Rounding leftovers go to the largest-remainder rows so the split always
 * sums to exactly the amount entered.
 */
export function allocatePool(amount: number, invoices: PoolInvoice[]): PoolAllocation[] {
  const totalWeight = invoices.reduce((sum, inv) => sum + inv.weight, 0);
  if (!(amount > 0) || totalWeight <= 0) {
    return invoices.map((inv) => ({ invoice_id: inv.invoice_id, name: inv.name, amount: 0 }));
  }

  const totalCents = Math.round(amount * 100);
  const exact = invoices.map((inv) => (totalCents * inv.weight) / totalWeight);
  const cents = exact.map((value) => Math.floor(value));
  let leftover = totalCents - cents.reduce((sum, value) => sum + value, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (leftover <= 0) break;
    cents[index] += 1;
    leftover -= 1;
  }

  return invoices.map((inv, index) => ({
    invoice_id: inv.invoice_id,
    name: inv.name,
    amount: cents[index] / 100,
  }));
}
