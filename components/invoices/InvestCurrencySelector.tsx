"use client";

import { Label } from "@/components/ui/label";
import {
  BASE_CURRENCY,
  INVEST_CURRENCIES,
  formatRateAge,
  isInvestCurrency,
  rateAgeSeconds,
  toBaseAmount,
  type FxRate,
  type InvestCurrency,
} from "@/lib/investCurrency";

interface InvestCurrencySelectorProps {
  currency: InvestCurrency;
  onCurrencyChange: (currency: InvestCurrency) => void;
  amount: number | null;
  rate: FxRate | undefined;
  isRateLoading: boolean;
  isRateError: boolean;
  isRateStale: boolean;
  now?: number;
}

export function InvestCurrencySelector({
  currency,
  onCurrencyChange,
  amount,
  rate,
  isRateLoading,
  isRateError,
  isRateStale,
  now,
}: InvestCurrencySelectorProps) {
  const isBase = currency === BASE_CURRENCY;
  const baseAmount =
    amount !== null && rate ? toBaseAmount(amount, rate.rate) : isBase ? amount : null;

  return (
    <div className="space-y-2" data-testid="invest-currency-selector">
      <Label htmlFor="invest-currency">Pay with</Label>
      <select
        id="invest-currency"
        value={currency}
        onChange={(e) => {
          if (isInvestCurrency(e.target.value)) onCurrencyChange(e.target.value);
        }}
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        data-testid="invest-currency-select"
      >
        {INVEST_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {!isBase && (
        <div className="space-y-1 text-xs" data-testid="invest-fx-info">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Equivalent in {BASE_CURRENCY}</span>
            <span className="font-medium tabular-nums" data-testid="invest-base-preview">
              {baseAmount === null
                ? "—"
                : `${baseAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} ${BASE_CURRENCY}`}
            </span>
          </div>

          {isRateLoading && (
            <p className="text-muted-foreground" data-testid="invest-fx-loading">
              Fetching {currency} rate…
            </p>
          )}
          {isRateError && (
            <p className="text-destructive" role="alert" data-testid="invest-fx-error">
              Could not load the {currency} rate. Try again in a moment.
            </p>
          )}
          {rate && (
            <p
              className={isRateStale ? "text-destructive" : "text-muted-foreground"}
              data-testid="invest-fx-rate"
            >
              1 {currency} = {rate.rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
              {BASE_CURRENCY} · updated {formatRateAge(rateAgeSeconds(rate.updated_at, now))}
            </p>
          )}
          {rate && isRateStale && (
            <p className="text-destructive" role="alert" data-testid="invest-fx-stale">
              This rate is stale. Investing is paused until the price refreshes.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
