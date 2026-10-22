import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRollover } from "@/hooks/useRollover";
import type { RolloverConfig } from "@/lib/rollover";
import { RolloverSettingsPanel } from "../RolloverSettingsPanel";

vi.mock("@/hooks/useRollover", () => ({
  useRollover: vi.fn(),
}));

const mockedUseRollover = vi.mocked(useRollover);

type HookReturn = ReturnType<typeof useRollover>;

function fakeMutation<T>() {
  return { mutate: vi.fn(), isPending: false } as unknown as T;
}

function setup(overrides: Partial<HookReturn> = {}) {
  const save = fakeMutation<HookReturn["save"]>();
  const disable = fakeMutation<HookReturn["disable"]>();
  mockedUseRollover.mockReturnValue({
    config: null,
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RolloverSettingsPanel (#545)", () => {
  it("asks for a wallet when disconnected", () => {
    setup({ isConnected: false });
    render(<RolloverSettingsPanel />);
    expect(screen.getByTestId("rollover-connect")).toBeInTheDocument();
  });

  it("blocks saving until a sector is chosen", async () => {
    const { save } = setup();
    render(<RolloverSettingsPanel />);

    await userEvent.click(screen.getByTestId("rollover-save"));

    expect(screen.getByTestId("rollover-sector-error")).toBeInTheDocument();
    expect(save.mutate).not.toHaveBeenCalled();
  });

  it("saves the chosen criteria as one config", async () => {
    const { save } = setup();
    render(<RolloverSettingsPanel />);

    await userEvent.selectOptions(screen.getByTestId("rollover-sector"), "energy");
    await userEvent.click(screen.getByTestId("rollover-save"));

    expect(save.mutate).toHaveBeenCalledWith(
      { sector: "energy", minYield: 5, maxInvoiceAgeDays: 30, maxAmount: 1000 },
      expect.any(Object),
    );
  });

  it("summarises the active rollover and confirms before disabling", async () => {
    const config: RolloverConfig = {
      sector: "energy",
      minYield: 6,
      maxInvoiceAgeDays: 60,
      maxAmount: 2000,
      isEnabled: true,
    };
    const { disable } = setup({ config });
    render(<RolloverSettingsPanel />);

    expect(screen.getByTestId("rollover-summary-sector")).toHaveTextContent("Energy");
    expect(screen.getByTestId("rollover-summary-min-yield")).toHaveTextContent("6%");

    await userEvent.click(screen.getByTestId("rollover-toggle"));
    await userEvent.click(await screen.findByTestId("confirm-disable-rollover"));

    expect(disable.mutate).toHaveBeenCalled();
  });
});
