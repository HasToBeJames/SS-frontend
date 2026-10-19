"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TransferRestrictionType } from "@/lib/api";
import { ACCESS_RESTRICTIONS, type AccessRestrictionType } from "@/lib/restrictions";

const RESTRICTION_MAP: Record<TransferRestrictionType, AccessRestrictionType> = {
  kyc_required: "KYCRequired",
  jurisdiction_blocked: "JurisdictionBlocked",
  accreditation_required: "AccreditationRequired",
};

interface TransferBlockedProps {
  restriction: TransferRestrictionType;
  onRetry: () => void;
  isRetrying?: boolean;
}

/** Replaces the buy button when the pre-flight check blocks the purchase. */
export function TransferBlocked({ restriction, onRetry, isRetrying = false }: TransferBlockedProps) {
  const config = ACCESS_RESTRICTIONS[RESTRICTION_MAP[restriction]];

  return (
    <div
      role="alert"
      data-testid="transfer-blocked"
      data-restriction={restriction}
      className="flex w-full flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium text-destructive">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          This purchase is blocked
        </p>
        <Badge variant="outline" className="border-destructive/40 text-destructive" data-testid="transfer-blocked-chip">
          {config.chipLabel}
        </Badge>
        <p className="text-sm text-muted-foreground" data-testid="transfer-blocked-help">
          {config.guidance}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full shrink-0 sm:w-auto"
        onClick={onRetry}
        disabled={isRetrying}
        data-testid="transfer-blocked-retry"
      >
        {isRetrying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Checking…
          </>
        ) : (
          "Check again"
        )}
      </Button>
    </div>
  );
}
