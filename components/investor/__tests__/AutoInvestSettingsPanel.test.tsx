import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAutoInvest } from "@/hooks/useAutoInvest";
import type { AutoInvestExecutedEvent } from "@/lib/api";
import type { AutoInvestRule } from "@/lib/autoInvest";
import { AutoInvestSettingsPanel } from "../AutoInvestSettingsPanel";

vi.mock("@/hooks/useAutoInvest", () => ({
  useAutoInvest: vi.fn(),
}));

const mockedUseAutoInvest = vi.mocked(useAutoInvest);

type HookReturn = ReturnType<typeof useAutoInvest>;

function fakeMutation<T>() {
  const mutate = vi.fn();
  return { mutate, isPending: false } as unknown as T;
}

function setup(overrides: Partial<HookReturn> = {}) {
  const save = fakeMutation<HookReturn["save"]>();
  const disable = fakeMutation<HookReturn["disable"]>();
  mockedUseAutoInvest.mockReturnValue({
    rule: null,
    events: [],
    isLoading: false,
    isError: false,
    isConnected: true,
    save,
    disable,
    ...overrides,
  });
  return { save, disable };
}

const ACTIVE_RULE: AutoInvestRule = {
  sectors: ["energy"],
  minYield: 8,
  maxInvoiceAgeDays: 20,
  maxAmountPerInvoice: 900,
  isEnabled: true,
};

const EVENT: AutoInvestExecutedEvent = {
  id: "evt-1",
  invoice_id: "inv-1",
  invoice_title: "Acme receivable",
  amount: 500,
  yield_percentage: 8.5,
  sector: "trade_finance",
  executed_at: "2026-10-15T14:30:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AutoInvestSettingsPanel (#476)", () => {
  it("blocks saving and shows errors when required fields are empty", async () => {
    const { save } = setup();

    render(<AutoInvestSettingsPanel />);
    await userEvent.click(screen.getByTestId("auto-invest-save"));

    expect(screen.getByTestId("sectors-error")).toBeInTheDocument();
    expect(save.mutate).not.toHaveBeenCalled();
  });

  it("parses the form and submits the rule to the contract", async () => {
    const { save } = setup();

    render(<AutoInvestSettingsPanel />);
    await userEvent.click(screen.getByTestId("sector-chip-trade_finance"));
    await userEvent.click(screen.getByTestId("auto-invest-save"));

    expect(save.mutate).toHaveBeenCalledWith(
      {
        sectors: ["trade_finance"],
        minYield: 5,
        maxInvoiceAgeDays: 30,
        maxAmountPerInvoice: 1_000,
      },
      expect.anything(),
    );
  });

  it("shows the summary instead of the form when a rule is active", () => {
    setup({ rule: ACTIVE_RULE });

    render(<AutoInvestSettingsPanel />);

    expect(screen.getByTestId("auto-invest-rule-summary")).toBeInTheDocument();
    expect(screen.queryByTestId("auto-invest-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("auto-invest-summary-status")).toHaveTextContent(
      "Enabled",
    );
  });

  it("asks for confirmation before disabling and then calls disable", async () => {
    const { disable } = setup({ rule: ACTIVE_RULE });

    render(<AutoInvestSettingsPanel />);
    await userEvent.click(screen.getByTestId("auto-invest-toggle"));

    expect(
      await screen.findByTestId("disable-auto-invest-dialog"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("confirm-disable-auto-invest"));
    expect(disable.mutate).toHaveBeenCalledTimes(1);
  });

  it("re-enables a saved but disabled rule without re-opening the editor", async () => {
    const disabledRule: AutoInvestRule = { ...ACTIVE_RULE, isEnabled: false };
    const { save } = setup({ rule: disabledRule });

    render(<AutoInvestSettingsPanel />);
    await userEvent.click(screen.getByTestId("auto-invest-toggle"));

    expect(save.mutate).toHaveBeenCalledWith(disabledRule);
  });

  it("lists recent AutoInvestExecuted events", () => {
    setup({ rule: ACTIVE_RULE, events: [EVENT] });

    render(<AutoInvestSettingsPanel />);

    expect(screen.getByTestId("auto-invest-event-evt-1")).toHaveTextContent(
      "Acme receivable",
    );
  });

  it("prompts to connect a wallet when disconnected", () => {
    setup({ isConnected: false });

    render(<AutoInvestSettingsPanel />);

    expect(screen.getByTestId("auto-invest-connect")).toBeInTheDocument();
  });
});
