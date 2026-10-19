/**
 * Secondary-market listing fee (issue #496).
 *
 * The fee rate comes from the contract's `get_listing_fee` call (exposed by the
 * API). It is charged to the seller's wallet when the listing is created and
 * routed to the protocol treasury.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface ListingFeeConfig {
  /** Fee rate in basis points of the listing's gross value. */
  fee_bps: number;
  /** Treasury address the fee is routed to. */
  treasury: string;
}

export interface ListingFeePreview {
  gross: number;
  fee: number;
  /** Proceeds after the listing fee is deducted from the sale value. */
  netProceeds: number;
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

export function computeListingFee(
  quantity: number,
  askPrice: number,
  feeBps: number
): ListingFeePreview {
  if (
    !Number.isFinite(quantity) ||
    !Number.isFinite(askPrice) ||
    quantity <= 0 ||
    askPrice <= 0 ||
    !Number.isFinite(feeBps) ||
    feeBps < 0
  ) {
    return { gross: 0, fee: 0, netProceeds: 0 };
  }
  const gross = quantity * askPrice;
  const fee = (gross * feeBps) / 10_000;
  return { gross, fee, netProceeds: gross - fee };
}

export function canCoverFee(balance: number | null, fee: number): boolean {
  // An unknown balance is not the same as an insufficient one.
  return balance === null || balance >= fee;
}

export async function fetchListingFeeConfig(signal?: AbortSignal): Promise<ListingFeeConfig> {
  const res = await fetch(`${API_BASE}/secondary-market/listing-fee`, { signal });
  if (!res.ok) throw new Error("Failed to fetch listing fee");
  return res.json();
}

export interface CreateListingInput {
  invoiceId: string;
  quantity: number;
  askPrice: number;
}

export async function createListing(
  input: CreateListingInput
): Promise<{ id: string; transaction_hash?: string }> {
  const res = await fetch(`${API_BASE}/secondary-market/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invoice_id: input.invoiceId,
      quantity: input.quantity,
      ask_price: input.askPrice,
    }),
  });
  if (!res.ok) throw new Error("Failed to create listing");
  return res.json();
}
