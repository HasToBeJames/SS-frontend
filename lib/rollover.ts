import type { RolloverConfigPayload } from "@/lib/api";
import {
  isAutoInvestSector,
  type AutoInvestSector,
} from "@/lib/autoInvest";

/**
 * Invoice auto-rollover domain (#545).
 *
 * When a funded position matures, the protocol reinvests it into an invoice
 * that matches the rollover criteria: one sector, a minimum yield, a maximum
 * invoice age and a maximum amount. Sectors share the auto-invest taxonomy.
 *
 * Validation and wire mapping live here, free of React and network, so the
 * form, the summary card and the tests agree on what a valid config is.
 */

export interface RolloverConfigInput {
  sector: AutoInvestSector;
  minYield: number;
  maxInvoiceAgeDays: number;
  maxAmount: number;
}

export interface RolloverConfig extends RolloverConfigInput {
  isEnabled: boolean;
  updatedAt?: string;
}

/** Raw form state. Numbers are strings so an empty input reads as missing. */
export interface RolloverDraft {
  sector: string;
  minYield: string;
  maxInvoiceAgeDays: string;
  maxAmount: string;
}

export interface RolloverErrors {
  sector?: string;
  minYield?: string;
  maxInvoiceAgeDays?: string;
  maxAmount?: string;
}

export interface RolloverValidationResult {
  valid: boolean;
  errors: RolloverErrors;
  /** The parsed config, or `null` when validation failed. */
  config: RolloverConfigInput | null;
}

const DEFAULT_DRAFT: RolloverDraft = {
  sector: "",
  minYield: "5",
  maxInvoiceAgeDays: "30",
  maxAmount: "1000",
};

function parseNumber(value: string): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateRolloverConfig(draft: RolloverDraft): RolloverValidationResult {
  const errors: RolloverErrors = {};

  if (!isAutoInvestSector(draft.sector)) {
    errors.sector = "Select a sector.";
  }

  const minYield = parseNumber(draft.minYield);
  if (minYield === null) {
    errors.minYield = "Minimum yield is required.";
  } else if (minYield < 0 || minYield > 100) {
    errors.minYield = "Yield must be between 0 and 100.";
  }

  const age = parseNumber(draft.maxInvoiceAgeDays);
  if (age === null) {
    errors.maxInvoiceAgeDays = "Maximum invoice age is required.";
  } else if (!Number.isInteger(age) || age < 1 || age > 3_650) {
    errors.maxInvoiceAgeDays = "Enter a whole number of days between 1 and 3,650.";
  }

  const maxAmount = parseNumber(draft.maxAmount);
  if (maxAmount === null) {
    errors.maxAmount = "Maximum amount is required.";
  } else if (maxAmount <= 0) {
    errors.maxAmount = "Amount must be greater than 0.";
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    config: valid
      ? {
          sector: draft.sector as AutoInvestSector,
          minYield: minYield as number,
          maxInvoiceAgeDays: age as number,
          maxAmount: maxAmount as number,
        }
      : null,
  };
}

/** Seeds the editable form from a saved config, or the defaults for a new one. */
export function rolloverToDraft(config: RolloverConfigInput | null | undefined): RolloverDraft {
  if (!config) return { ...DEFAULT_DRAFT };
  return {
    sector: config.sector,
    minYield: String(config.minYield),
    maxInvoiceAgeDays: String(config.maxInvoiceAgeDays),
    maxAmount: String(config.maxAmount),
  };
}

/** Maps the API response onto the domain config, dropping an unknown sector. */
export function toRolloverConfig(payload: RolloverConfigPayload): RolloverConfig | null {
  if (!isAutoInvestSector(payload.sector)) return null;
  return {
    sector: payload.sector,
    minYield: payload.min_yield,
    maxInvoiceAgeDays: payload.max_invoice_age,
    maxAmount: payload.max_amount,
    isEnabled: payload.is_enabled,
    updatedAt: payload.updated_at,
  };
}

export function toRolloverConfigPayload(
  config: RolloverConfigInput,
  isEnabled: boolean,
): RolloverConfigPayload {
  return {
    sector: config.sector,
    min_yield: config.minYield,
    max_invoice_age: config.maxInvoiceAgeDays,
    max_amount: config.maxAmount,
    is_enabled: isEnabled,
  };
}
