import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReturnsCalculator } from "@/components/invoices/ReturnsCalculator";

const future = new Date(Date.now() + 73 * 86_400_000 - 3_600_000).toISOString();

describe("ReturnsCalculator", () => {
  it("updates outputs on every keypress", async () => {
    render(<ReturnsCalculator faceValue={10_000} yieldPercentage={12} maturityDate={future} fractionPrice={1} />);
    const input = screen.getByTestId("returns-amount-input");
    await userEvent.type(input, "1");
    expect(screen.getByTestId("returns-fractions")).toHaveTextContent("1");
    await userEvent.type(input, "000");
    expect(screen.getByTestId("returns-fractions")).toHaveTextContent("1,000");
    expect(screen.getByTestId("returns-share")).toHaveTextContent("10.00%");
    expect(screen.getByTestId("returns-yield")).toHaveTextContent("24.00 XLM");
  });

  it("shows methodology tooltip on focus", async () => {
    render(<ReturnsCalculator faceValue={100} yieldPercentage={10} maturityDate={future} />);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.hover(screen.getByTestId("returns-methodology-trigger"));
    expect((await screen.findAllByText(/pro-rata share/i)).length).toBeGreaterThan(0);
  });
});
