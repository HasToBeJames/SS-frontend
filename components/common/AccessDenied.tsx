"use client";

import Link from "next/link";
import { Globe, KeyRound, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACCESS_RESTRICTIONS,
  type AccessRestrictionType,
} from "@/lib/restrictions";

const ICONS: Record<AccessRestrictionType, LucideIcon> = {
  KYCRequired: ShieldAlert,
  JurisdictionBlocked: Globe,
  AccreditationRequired: ShieldCheck,
  SignerOnly: KeyRound,
};

interface AccessDeniedProps {
  restriction: AccessRestrictionType;
  /** Fill the surrounding card/panel instead of a full-page min height. */
  compact?: boolean;
  className?: string;
}

export function AccessDenied({ restriction, compact = false, className }: AccessDeniedProps) {
  const config = ACCESS_RESTRICTIONS[restriction];
  const Icon = ICONS[restriction];

  return (
    <div
      role="alert"
      data-testid="access-denied"
      data-restriction={restriction}
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 text-center",
        compact ? "py-8" : "min-h-[50vh] justify-center py-12",
        className,
      )}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        data-testid="access-denied-icon"
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="text-xl font-semibold" data-testid="access-denied-heading">
        {config.heading}
      </h2>
      <p className="text-sm text-muted-foreground" data-testid="access-denied-explanation">
        {config.explanation}
      </p>
      {config.cta && (
        <Button asChild className="mt-2 w-full sm:w-auto" data-testid="access-denied-cta">
          <Link href={config.cta.href}>{config.cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
