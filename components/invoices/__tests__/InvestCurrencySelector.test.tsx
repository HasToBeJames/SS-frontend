import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InvestCurrencySelector } from "../InvestCurrencySelector";

const NOW = Date.parse("2026-01-01T00:10:00Z");

function renderSelector(over: Partial<React.ComponentProps<typeof InvestCurrencySelector>> = {}) {
  const onCurrencyChange = vi.fn();
  render(
    <InvestCurrencySelector
      currency="EURC"
      onCurrencyChange={onCurrencyChange}
      amount={100}
      rate={{ currency: "EURC", rate: 1.1, updated_at: "2026-01-01T00:08:00Z" }}
      isRateLoading={false}
      isRateError={false}
      isRateStale={false}
      now={NOW}
      {...over}
    />
  );
  return { onCurrencyChange };
}

describe("InvestCurrencySelector (issue #497)", () => {
  it("renders USDC, EURC and NGNC options", () => {
    renderSelector();
    const options = Array.from(
      screen.getByTestId("invest-currency-select").querySelectorAll("option")
    ).map((o) => o.value);
    expect(options).toEqual(["USDC", "EURC", "NGNC"]);
  });

  it("previews the base-currency amount and rate age", () => {
    renderSelector();
    expect(screen.getByTestId("invest-base-preview")).toHaveTextContent("110.00 USDC");
    expect(screen.getByTestId("invest-fx-rate")).toHaveTextContent("updated 2m ago");
    expect(screen.queryByTestId("invest-fx-stale")).not.toBeInTheDocument();
  });

  it("notifies on currency change", () => {
    const { onCurrencyChange } = renderSelector();
    fireEvent.change(screen.getByTestId("invest-currency-select"), {
      target: { value: "NGNC" },
    });
    expect(onCurrencyChange).toHaveBeenCalledWith("NGNC");
  });

  it("flags a stale rate", () => {
    renderSelector({ isRateStale: true });
    expect(screen.getByTestId("invest-fx-stale")).toBeInTheDocument();
  });

  it("hides FX details for the base currency", () => {
    renderSelector({ currency: "USDC", rate: undefined });
    expect(screen.queryByTestId("invest-fx-info")).not.toBeInTheDocument();
  });
});
