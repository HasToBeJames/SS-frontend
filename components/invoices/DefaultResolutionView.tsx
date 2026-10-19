"use client";

/**
 * Default Resolution View (#483)
 *
 * Shown in place of the normal invoice detail header when an invoice's status
 * is "defaulted". Displays the default declaration, collateral forfeiture,
 * recovery amount distributed, and a per-holder recovery receipt for the
 * connected wallet.
 */

import { AlertOctagon, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchDefaultResolution, type DefaultResolution } from "@/lib/api";

function formatAmount(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

export function DefaultResolutionSkeleton() {
  return (
    <div className="space-y-4" data-testid="default-resolution-loading" aria-busy="true">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Default banner ──────────────────────────────────────────────────────────

function DefaultBanner({ resolution }: { resolution: DefaultResolution }) {
  return (
    <Card
      className="border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30"
      data-testid="default-banner"
    >
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <AlertOctagon
            className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <div className="space-y-3 w-full">
            <div>
              <p
                className="text-lg font-bold text-red-900 dark:text-red-100"
                data-testid="default-banner-title"
              >
                Invoice Defaulted
              </p>
              <p
                className="text-sm text-red-700 dark:text-red-300"
                data-testid="default-banner-date"
              >
                Default declared on {formatDate(resolution.declaration_date)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-red-600/70 dark:text-red-400/70">
                  Collateral forfeited
                </dt>
                <dd
                  className="font-semibold text-red-800 dark:text-red-200"
                  data-testid="collateral-forfeited"
                >
                  {formatAmount(resolution.collateral_forfeited)} XLM
                </dd>
              </div>

              <div>
                <dt className="text-xs text-red-600/70 dark:text-red-400/70">
                  Total recovery distributed
                </dt>
                <dd
                  className="font-semibold text-red-800 dark:text-red-200"
                  data-testid="total-recovery"
                >
                  {resolution.recovery_distribution_pending ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Pending
                    </span>
                  ) : (
                    `${formatAmount(resolution.total_recovery_distributed)} XLM`
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-red-600/70 dark:text-red-400/70">
                  Distribution status
                </dt>
                <dd className="font-semibold text-red-800 dark:text-red-200">
                  {resolution.recovery_distribution_pending ? (
                    <span className="text-amber-700 dark:text-amber-300">
                      In progress
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Complete
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/30"
              data-testid="dispute-link"
            >
              <a
                href={resolution.dispute_form_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Dispute this default
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Per-holder recovery table ───────────────────────────────────────────────

interface HolderRecoveryTableProps {
  resolution: DefaultResolution;
  connectedAddress: string | null | undefined;
}

function HolderRecoveryTable({ resolution, connectedAddress }: HolderRecoveryTableProps) {
  const connectedHolder = connectedAddress
    ? resolution.holders.find(
        (h) => h.address.toLowerCase() === connectedAddress.toLowerCase()
      )
    : null;

  return (
    <Card data-testid="recovery-table">
      <CardHeader>
        <h2 className="text-lg font-semibold">Recovery receipts</h2>
        {resolution.recovery_distribution_pending && (
          <p className="text-sm text-muted-foreground">
            Recovery amounts are being calculated. Final amounts will appear once
            distribution is complete.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected wallet highlight */}
        {connectedHolder && (
          <div
            className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/20"
            data-testid="your-recovery"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Your recovery
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Invested:{" "}
                  <span className="font-medium text-foreground">
                    {formatAmount(connectedHolder.investment_amount)} XLM
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Recovery:{" "}
                  <span
                    className="font-semibold text-foreground"
                    data-testid="your-recovery-amount"
                  >
                    {resolution.recovery_distribution_pending
                      ? "Pending"
                      : `${formatAmount(connectedHolder.recovery_amount)} XLM`}
                  </span>
                </p>
                {connectedHolder.recovery_paid && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Paid to your wallet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All holders */}
        {resolution.holders.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              aria-label="Recovery distribution by holder"
            >
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Investor</th>
                  <th className="pb-2 text-right font-medium">Invested</th>
                  <th className="pb-2 text-right font-medium">Recovery</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {resolution.holders.map((holder) => {
                  const isConnected =
                    connectedAddress &&
                    holder.address.toLowerCase() === connectedAddress.toLowerCase();
                  return (
                    <tr
                      key={holder.address}
                      className={`border-b last:border-0 ${isConnected ? "bg-blue-50/30 dark:bg-blue-950/10" : ""}`}
                      data-testid={`holder-row-${holder.address}`}
                    >
                      <td className="py-2 font-mono text-xs">
                        {holder.address.slice(0, 8)}…{holder.address.slice(-4)}
                        {isConnected && (
                          <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            you
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {formatAmount(holder.investment_amount)} XLM
                      </td>
                      <td
                        className="py-2 text-right font-medium"
                        data-testid={`recovery-amount-${holder.address}`}
                      >
                        {resolution.recovery_distribution_pending
                          ? "—"
                          : `${formatAmount(holder.recovery_amount)} XLM`}
                      </td>
                      <td className="py-2 text-right">
                        {holder.recovery_paid ? (
                          <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Paid
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="no-holders">
            No holder data available yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface DefaultResolutionViewProps {
  invoiceId: string;
  connectedAddress: string | null | undefined;
}

export function DefaultResolutionView({
  invoiceId,
  connectedAddress,
}: DefaultResolutionViewProps) {
  const { data: resolution, isLoading, isError } = useQuery({
    queryKey: ["default-resolution", invoiceId],
    queryFn: () => fetchDefaultResolution(invoiceId),
    staleTime: 60 * 1000,
    retry: 1,
  });

  if (isLoading) return <DefaultResolutionSkeleton />;

  if (isError || !resolution) {
    return (
      <Card data-testid="default-resolution-error">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Default resolution data could not be loaded. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="default-resolution-view">
      <DefaultBanner resolution={resolution} />
      <HolderRecoveryTable
        resolution={resolution}
        connectedAddress={connectedAddress}
      />
    </div>
  );
}
