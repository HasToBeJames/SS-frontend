import type { AutoInvestRulePayload } from "@/lib/api";

// Re-exported so consumers can pull the rule wire types from one place.
export type { AutoInvestRulePayload };

/**
 * Auto-invest rule domain (#476).
 *
 * An investor configures a single rule describing which invoices the protocol
 * may buy on their behalf: a set of sectors, a minimum yield, a maximum invoice
 * age, and a per-invoice spend cap. The rule is stored on-chain via
 * `set_auto_invest_rule` and can be disabled with `disable_auto_invest`.
 *
 * The validation and mapping logic lives here, free of React and network, so
 * the form, the summary card, and the tests all share one definition of a
 * valid rule.
 */

export const AUTO_INVEST_SECTORS = [
  "trade_finance",
  "real_estate",
  "sme",
  "technology",
  "healthcare",
  "manufacturing",
  "retail",
  "energy",
] as const;

export type AutoInvestSector = (typeof AUTO_INVEST_SECTORS)[number];

export const AUTO_INVEST_SECTOR_LABELS: Record<AutoInvestSector, string> = {
  trade_finance: "Trade finance",
  real_estate: "Real estate",
  sme: "SME",
  technology: "Technology",
  healthcare: "Healthcare",
  manufacturing: "Manufacturing",
  retail: "Retail",
  energy: "Energy",
};

export interface AutoInvestRuleInput {
  sectors: AutoInvestSector[];
  minYield: number;
  maxInvoiceAgeDays: number;
  maxAmountPerInvoice: number;
}

export interface AutoInvestRule extends AutoInvestRuleInput {
  isEnabled: boolean;
  updatedAt?: string;
}

export const DEFAULT_AUTO_INVEST_RULE: AutoInvestRuleInput = {
  sectors: [],
  minYield: 5,
  maxInvoiceAgeDays: 30,
  maxAmountPerInvoice: 1_000,
};

export function isAutoInvestSector(value: unknown): value is AutoInvestSector {
  return (
    typeof value === "string" &&
    (AUTO_INVEST_SECTORS as readonly string[]).includes(value)
  );
}

export function sectorLabel(sector: string): string {
  return isAutoInvestSector(sector)
    ? AUTO_INVEST_SECTOR_LABELS[sector]
    : sector;
}

/** "Trade finance, SME" — or "Any sector" when none are selected. */
export function formatSectors(sectors: readonly string[]): string {
  if (sectors.length === 0) return "Any sector";
  return sectors.map(sectorLabel).join(", ");
}

/* ─── Draft + validation ─────────────────────────────────────────────────── */

/**
 * Raw form state. Numbers are strings so an empty input is distinguishable
 * from a deliberate `0`, which matters for "required" validation.
 */
export interface AutoInvestRuleDraft {
  sectors: string[];
  minYield: string;
  maxInvoiceAgeDays: string;
  maxAmountPerInvoice: string;
}

export interface AutoInvestRuleErrors {
  sectors?: string;
  minYield?: string;
  maxInvoiceAgeDays?: string;
  maxAmountPerInvoice?: string;
}

export interface AutoInvestValidationResult {
  valid: boolean;
  errors: AutoInvestRuleErrors;
  /** The parsed rule, or `null` when validation failed. */
  rule: AutoInvestRuleInput | null;
}

function parseNumber(value: string): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateAutoInvestRule(
  draft: AutoInvestRuleDraft,
): AutoInvestValidationResult {
  const errors: AutoInvestRuleErrors = {};

  const sectors = draft.sectors.filter(isAutoInvestSector);
  if (sectors.length === 0) {
    errors.sectors = "Select at least one sector.";
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

  const maxAmount = parseNumber(draft.maxAmountPerInvoice);
  if (maxAmount === null) {
    errors.maxAmountPerInvoice = "Maximum amount per invoice is required.";
  } else if (maxAmount <= 0) {
    errors.maxAmountPerInvoice = "Amount must be greater than 0.";
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    rule: valid
      ? {
          sectors,
          minYield: minYield as number,
          maxInvoiceAgeDays: age as number,
          maxAmountPerInvoice: maxAmount as number,
        }
      : null,
  };
}

/** Seeds the editable form from an existing rule (or the defaults). */
export function ruleToDraft(
  rule: AutoInvestRuleInput | null | undefined,
): AutoInvestRuleDraft {
  const base = rule ?? DEFAULT_AUTO_INVEST_RULE;
  return {
    sectors: [...base.sectors],
    minYield: String(base.minYield),
    maxInvoiceAgeDays: String(base.maxInvoiceAgeDays),
    maxAmountPerInvoice: String(base.maxAmountPerInvoice),
  };
}

/* ─── Wire mapping ───────────────────────────────────────────────────────── */

/** Maps the contract/API response onto the domain rule, dropping unknown sectors. */
export function toAutoInvestRule(payload: AutoInvestRulePayload): AutoInvestRule {
  return {
    sectors: payload.sectors.filter(isAutoInvestSector),
    minYield: payload.min_yield,
    maxInvoiceAgeDays: payload.max_invoice_age_days,
    maxAmountPerInvoice: payload.max_amount_per_invoice,
    isEnabled: payload.is_enabled,
    updatedAt: payload.updated_at,
  };
}

export function toAutoInvestRulePayload(
  rule: AutoInvestRuleInput,
  isEnabled: boolean,
): AutoInvestRulePayload {
  return {
    sectors: [...rule.sectors],
    min_yield: rule.minYield,
    max_invoice_age_days: rule.maxInvoiceAgeDays,
    max_amount_per_invoice: rule.maxAmountPerInvoice,
    is_enabled: isEnabled,
  };
}
