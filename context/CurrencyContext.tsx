"use client";

/**
 * Multi-currency display (#437)
 *
 * One provider owns the display currency and the XLM → USD rate for the
 * whole app. Previously every `useCurrency()` call held its own copy of the
 * state, so flipping the toggle in one place did not update the rest of the
 * page, and the "rate" was a hard-coded placeholder. Now:
 *
 *  - The preference is read from localStorage after mount (so server and
 *    client render the same markup; no hydration mismatch), written on every
 *    change, and synced across tabs via the `storage` event.
 *  - The rate is fetched from Horizon on app load and then every 5 minutes.
 *    A background refresh never clears the current rate or shows a loading
 *    state, so values don't flicker; a failed refresh keeps the last good rate
 *    (flagged stale once it's old enough).
 *  - A cached rate from the previous visit is shown immediately while the
 *    first fetch is in flight.
 */

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchFxRates } from "@/lib/api";
import {
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY,
  RATE_REFRESH_INTERVAL_MS,
  convertXlmToUsd,
  formatFiat,
  isCurrency,
  isFiatCurrency,
  isRateStale,
  parseFxRates,
  rateFor,
  readStoredCurrency,
  readStoredRate,
  writeStoredCurrency,
  writeStoredRate,
  type Currency,
  type ExchangeRate,
  type FxRates,
} from "@/lib/currency";

export interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  /**
   * Value of 1 XLM in the selected display currency (USD while XLM is
   * selected), or null until a rate is known.
   */
  rate: number | null;
  /** Full rate record (value + fetch time), or null until known. */
  exchangeRate: ExchangeRate | null;
  /** True only while the very first rate is loading and nothing is cached. */
  rateLoading: boolean;
  /** True when the most recent refresh failed. */
  rateError: boolean;
  /** True once the shown rate is older than two refresh cycles. */
  isStale: boolean;
  /**
   * True when values are actually being shown in USD. USD can be selected
   * while no rate is known yet; values then stay in XLM (see disclaimer).
   */
  isConverted: boolean;
  /** Convert an XLM amount into the display currency. */
  convert: (xlmAmount: number) => number;
  /**
   * Format an XLM amount in the display currency. `xlmText` lets a caller
   * keep its existing XLM formatting when no conversion applies.
   */
  format: (xlmAmount: number, xlmText?: string) => string;
  /** Force an immediate rate refresh. */
  refreshRate: () => Promise<void>;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/** XLM formatting the previous `useCurrency().format` produced; kept as is. */
export function formatXlmDefault(xlmAmount: number): string {
  return `${xlmAmount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} XLM`;
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  /** Injected in tests; fetches only the XLM → USD rate. */
  fetchRate?: () => Promise<number>;
  /** Injected in tests; defaults to the FX oracle (USDC, EURC, NGNC). */
  fetchRates?: () => Promise<FxRates>;
  /** Injected in tests; defaults to 5 minutes. */
  refreshIntervalMs?: number;
}

export function CurrencyProvider({
  children,
  fetchRate,
  fetchRates,
  refreshIntervalMs = RATE_REFRESH_INTERVAL_MS,
}: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [rateError, setRateError] = useState(false);
  // Bumped after every refresh attempt so `isStale` is re-evaluated even when
  // a failed refresh leaves the rate itself unchanged.
  const [lastAttemptAt, setLastAttemptAt] = useState(0);

  const inFlight = useRef(false);
  const mounted = useRef(true);
  // Latest fetcher, read through a ref so the polling effect is not restarted
  // when a caller passes a new function identity.
  const fetchRateRef = useRef(fetchRate);
  const fetchRatesRef = useRef(fetchRates);
  useEffect(() => {
    fetchRateRef.current = fetchRate;
    fetchRatesRef.current = fetchRates;
  }, [fetchRate, fetchRates]);

  // Restore the saved preference and cached rate after mount.
  useEffect(() => {
    const stored = readStoredCurrency();
    if (stored) setCurrencyState(stored);
    const cached = readStoredRate();
    if (cached) setExchangeRate((current) => current ?? cached);
  }, []);

  // Keep several open tabs on the same currency.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CURRENCY_STORAGE_KEY && isCurrency(event.newValue)) {
        setCurrencyState(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const refreshRate = useCallback(async () => {
    // Skip overlapping refreshes (slow network plus the interval firing).
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      let next: ExchangeRate;
      if (fetchRatesRef.current || !fetchRateRef.current) {
        const fx = fetchRatesRef.current
          ? await fetchRatesRef.current()
          : parseFxRates(await fetchFxRates());
        if (!mounted.current) return;
        if (!fx.rates.USD) throw new Error("FX rates are missing USD");
        next = {
          rate: fx.rates.USD,
          fetchedAt: Date.now(),
          rates: fx.rates,
          oracleUpdatedAt: fx.updatedAt,
        };
      } else {
        const rate = await fetchRateRef.current();
        if (!mounted.current) return;
        next = { rate, fetchedAt: Date.now() };
      }
      setExchangeRate(next);
      writeStoredRate(next);
      setRateError(false);
    } catch {
      // Keep the last good rate; only record that this refresh failed.
      if (mounted.current) setRateError(true);
    } finally {
      inFlight.current = false;
      if (mounted.current) {
        setHasAttempted(true);
        setLastAttemptAt(Date.now());
      }
    }
  }, []);

  // Fetch on app load, then every `refreshIntervalMs` (5 minutes).
  useEffect(() => {
    mounted.current = true;
    void refreshRate();
    const id = setInterval(() => void refreshRate(), refreshIntervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refreshRate, refreshIntervalMs]);

  const setCurrency = useCallback((next: Currency) => {
    if (!isCurrency(next)) return;
    setCurrencyState(next);
    writeStoredCurrency(next);
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === "XLM" ? "USD" : "XLM");
  }, [currency, setCurrency]);

  const rate = isFiatCurrency(currency)
    ? rateFor(exchangeRate, currency)
    : (exchangeRate?.rate ?? null);
  const isConverted = isFiatCurrency(currency) && rate !== null;

  const convert = useCallback(
    (xlmAmount: number) => (isConverted ? convertXlmToUsd(xlmAmount, rate!) : xlmAmount),
    [isConverted, rate],
  );

  const format = useCallback(
    (xlmAmount: number, xlmText?: string) =>
      isConverted && isFiatCurrency(currency)
        ? formatFiat(convertXlmToUsd(xlmAmount, rate!), currency)
        : (xlmText ?? formatXlmDefault(xlmAmount)),
    [isConverted, currency, rate],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      toggleCurrency,
      rate,
      exchangeRate,
      rateLoading: !hasAttempted && exchangeRate === null,
      rateError,
      isStale: isRateStale(exchangeRate, Math.max(Date.now(), lastAttemptAt)),
      isConverted,
      convert,
      format,
      refreshRate,
    }),
    [
      currency,
      setCurrency,
      toggleCurrency,
      rate,
      exchangeRate,
      hasAttempted,
      rateError,
      lastAttemptAt,
      isConverted,
      convert,
      format,
      refreshRate,
    ],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
