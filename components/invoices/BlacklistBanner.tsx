"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { fetchIssuerBlacklist } from "@/lib/api";

export const issuerBlacklistQueryKey = (wallet: string) => ["issuer-blacklist", wallet] as const;

export function useIssuerBlacklist(wallet?: string | null) {
  return useQuery({
    queryKey: issuerBlacklistQueryKey(wallet ?? ""),
    queryFn: () => fetchIssuerBlacklist(wallet!),
    enabled: !!wallet,
  });
}

/**
 * Red warning shown on the issuer profile and every invoice detail page for
 * a blacklisted issuer. Renders nothing for issuers in good standing.
 */
export function IssuerBlacklistBanner({ wallet }: { wallet?: string | null }) {
  const { data } = useIssuerBlacklist(wallet);
  if (!data?.is_blacklisted) return null;

  return (
    <div
      role="alert"
      data-testid="issuer-blacklist-banner"
      className="flex gap-3 rounded-lg border border-red-600 bg-red-600/10 p-4 text-red-700 dark:text-red-400"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="space-y-1 text-sm">
        <p className="font-semibold">This issuer has been blacklisted</p>
        <p>New investments are disabled. Existing holders should review their positions.</p>
        {data.reason && (
          <p data-testid="blacklist-reason">
            <span className="font-medium">Reason:</span> {data.reason}
          </p>
        )}
        {data.blacklisted_at && (
          <p data-testid="blacklist-date">
            <span className="font-medium">Blacklisted on:</span>{" "}
            {format(new Date(data.blacklisted_at), "PPP")}
          </p>
        )}
      </div>
    </div>
  );
}
