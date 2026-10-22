import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AutoInvestActivityList } from "../AutoInvestActivityList";
import type { AutoInvestExecutedEvent } from "@/lib/api";

const EVENT: AutoInvestExecutedEvent = {
  id: "evt-1",
  invoice_id: "inv-1",
  invoice_title: "Acme receivable",
  amount: 500,
  yield_percentage: 8.5,
  sector: "trade_finance",
  executed_at: "2026-10-15T14:30:00.000Z",
};

describe("AutoInvestActivityList (#476)", () => {
  it("renders executed events with amount, yield and sector", () => {
    render(<AutoInvestActivityList events={[EVENT]} />);

    const row = screen.getByTestId("auto-invest-event-evt-1");
    expect(row).toHaveTextContent("Acme receivable");
    expect(row).toHaveTextContent("500 XLM");
    expect(row).toHaveTextContent("8.5%");
    expect(row).toHaveTextContent("Trade finance");
  });

  it("shows an empty state when nothing has executed", () => {
    render(<AutoInvestActivityList events={[]} />);

    expect(screen.getByTestId("auto-invest-activity-empty")).toBeInTheDocument();
  });
});
