"use client";

import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useWallet } from "@/context/WalletContext";
import { useCountdown } from "@/hooks/useCountdown";

interface SubscriptionGateProps {
  keyId: string;
  children: React.ReactNode;
}

/**
 * Gated content wrapper that checks if the connected wallet holds the minimum
 * required key balance for access. Shows locked state with buy CTA if under threshold,
 * unlocked state with subscription badge if subscribed.
 */
export function SubscriptionGate({ keyId, children }: SubscriptionGateProps) {
  const { isConnected, address } = useWallet();
  const { data: subscription, isLoading } = useSubscriptionStatus(
    keyId,
    address
  );

  // Show countdown for active subscriptions
  const expiryDate = subscription?.isSubscribed
    ? subscription.expiryDate ?? null
    : null;
  const timeRemaining = useCountdown(expiryDate, Boolean(expiryDate));

  // Don't gate if no wallet connected
  if (!isConnected) return <>{children}</>;

  if (isLoading) {
    return (
      <Card data-testid="subscription-gate-loading">
        <CardContent className="pt-6">
          <Skeleton className="h-9 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card data-testid="subscription-gate-error">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <Lock className="h-4 w-4" />
            <span>Unable to verify subscription status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User is subscribed and has minimum balance
  if (subscription.isSubscribed && subscription.keyBalance >= subscription.minimumRequired) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="inline-flex items-center gap-1" data-testid="subscription-badge">
            <ShieldCheck className="h-3 w-3" />
            Active Subscription
          </Badge>
          {expiryDate && (
            <span className="text-xs text-muted-foreground" data-testid="expiry-countdown">
              Expires in {timeRemaining.days}d {timeRemaining.hours}h{" "}
              {timeRemaining.minutes}m
            </span>
          )}
        </div>
        {children}
      </div>
    );
  }

  // User does not have minimum balance or subscription expired
  const insufficientBalance = subscription.keyBalance < subscription.minimumRequired;
  const accessLayerLink = `/keys/${keyId}`;

  return (
    <Card data-testid="subscription-gate-locked">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 text-destructive" />
          <span>
            This content requires holding{" "}
            <strong>{subscription.minimumRequired} key{subscription.minimumRequired !== 1 ? "s" : ""}</strong>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your balance: <strong>{subscription.keyBalance} key{subscription.keyBalance !== 1 ? "s" : ""}</strong>
        </p>
        {insufficientBalance && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
            You need {subscription.minimumRequired - subscription.keyBalance} more key{subscription.minimumRequired - subscription.keyBalance !== 1 ? "s" : ""}
          </p>
        )}
        <Button asChild variant="outline" size="sm" data-testid="buy-keys-cta">
          <Link href={accessLayerLink}>
            Buy Keys on AccessLayer
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
