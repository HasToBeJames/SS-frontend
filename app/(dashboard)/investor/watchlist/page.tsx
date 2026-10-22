import { redirect } from "next/navigation";

/**
 * The investor watchlist lives at `/watchlist` (#474).
 *
 * This route is kept as an alias because the mobile navigation used to link
 * here; it permanently forwards so there is only one watchlist implementation
 * reading from the on-chain registry.
 */
export default function InvestorWatchlistPage() {
  redirect("/watchlist");
}
