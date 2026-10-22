/**
 * Accreditation renewal reminders (#543).
 *
 * The renewal prompt appears once the accreditation expiry is under 60 days
 * away, and escalates as the date gets closer. The thresholds live here so the
 * banner and its tests share one definition.
 */

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Where the "Renew now" CTA sends the investor. */
export const ACCREDITATION_RENEWAL_ROUTE = "/profile#accreditation";

/** Days before expiry at which each severity starts. */
export const RENEWAL_THRESHOLD_DAYS = {
  notice: 60,
  warning: 30,
  critical: 7,
} as const;

export type RenewalSeverity = "notice" | "warning" | "critical";

/**
 * Severity for an expiry date, or `null` when the prompt should stay hidden.
 * An expiry that has already passed is treated as critical.
 */
export function getRenewalSeverity(
  expiresAt: string | null | undefined,
  now: number = Date.now(),
): RenewalSeverity | null {
  const remaining = remainingMs(expiresAt, now);
  if (remaining === null) return null;
  if (remaining < RENEWAL_THRESHOLD_DAYS.critical * MS_PER_DAY) return "critical";
  if (remaining < RENEWAL_THRESHOLD_DAYS.warning * MS_PER_DAY) return "warning";
  if (remaining < RENEWAL_THRESHOLD_DAYS.notice * MS_PER_DAY) return "notice";
  return null;
}

export interface RenewalCountdown {
  days: number;
  hours: number;
  expired: boolean;
}

/** Whole days and hours left until expiry, clamped at zero. */
export function getRenewalCountdown(
  expiresAt: string,
  now: number = Date.now(),
): RenewalCountdown {
  const remaining = remainingMs(expiresAt, now) ?? 0;
  if (remaining <= 0) return { days: 0, hours: 0, expired: true };
  return {
    days: Math.floor(remaining / MS_PER_DAY),
    hours: Math.floor((remaining % MS_PER_DAY) / MS_PER_HOUR),
    expired: false,
  };
}

/** Milliseconds until expiry, or `null` when there is no valid date. */
function remainingMs(expiresAt: string | null | undefined, now: number): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return null;
  return expiry - now;
}
