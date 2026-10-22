import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AutoInvestRuleSummary } from "../AutoInvestRuleSummary";

describe("AutoInvestRuleSummary (#476)", () => {
  it("renders the active configuration", () => {
    render(
      <AutoInvestRuleSummary
        rule={{
          sectors: ["trade_finance", "sme"],
          minYield: 7.5,
          maxInvoiceAgeDays: 45,
          maxAmountPerInvoice: 2_500,
          isEnabled: true,
        }}
      />,
    );

    expect(screen.getByTestId("auto-invest-summary-status")).toHaveTextContent(
      "Enabled",
    );
    expect(screen.getByTestId("auto-invest-summary-sectors")).toHaveTextContent(
      "Trade finance, SME",
    );
    expect(screen.getByTestId("auto-invest-summary-min-yield")).toHaveTextContent(
      "7.5%",
    );
    expect(screen.getByTestId("auto-invest-summary-max-age")).toHaveTextContent(
      "45 days",
    );
    expect(
      screen.getByTestId("auto-invest-summary-max-amount"),
    ).toHaveTextContent("2,500 XLM");
  });

  it("marks a saved-but-disabled rule as disabled", () => {
    render(
      <AutoInvestRuleSummary
        rule={{
          sectors: ["energy"],
          minYield: 5,
          maxInvoiceAgeDays: 30,
          maxAmountPerInvoice: 1_000,
          isEnabled: false,
        }}
      />,
    );

    expect(screen.getByTestId("auto-invest-summary-status")).toHaveTextContent(
      "Disabled",
    );
  });
});
