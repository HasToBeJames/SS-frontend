import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BenchmarkChip } from "../BenchmarkChip";
import { InvoiceCard } from "../invoice-card";
import { renderWithCardProviders } from "./render-with-card-providers";
import type { Invoice } from "@/lib/api";

const bench = { sector_avg_yield: 8, sample_size: 12 };

describe("BenchmarkChip (#530)", () => {
  it.each([
    [10, "Above Avg", "above", "bg-green-100"],
    [8.1, "Avg", "avg", "bg-gray-100"],
    [6, "Below Avg", "below", "bg-amber-100"],
  ])("renders yield %s as %s with matching colour", (yieldPct, label, rating, colour) => {
    render(<BenchmarkChip invoice={{ yield_percentage: yieldPct, sector_benchmark: bench }} />);
    const chip = screen.getByTestId("benchmark-chip");
    expect(chip).toHaveTextContent(label);
    expect(chip).toHaveAttribute("data-rating", rating);
    expect(chip).toHaveClass(colour);
  });

  it("shows the sector average and bps difference in the tooltip", async () => {
    render(<BenchmarkChip invoice={{ yield_percentage: 10, sector_benchmark: bench }} />);
    await userEvent.hover(screen.getByTestId("benchmark-chip"));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Sector average yield: 8%");
    expect(tooltip).toHaveTextContent("Difference: +200 bps");
  });

  it("renders nothing when the sector has insufficient data", () => {
    render(
      <BenchmarkChip
        invoice={{ yield_percentage: 10, sector_benchmark: { sector_avg_yield: 8, sample_size: 2 } }}
      />,
    );
    expect(screen.queryByTestId("benchmark-chip")).not.toBeInTheDocument();
  });

  it("appears on the grid InvoiceCard below the yield rate", () => {
    const invoice: Invoice = {
      id: "inv-1",
      title: "Acme",
      seller: "G",
      amount: 1000,
      raised: 0,
      investor_count: 0,
      status: "open",
      due_date: new Date("2030-01-01").toISOString(),
      yield_percentage: 10,
      sector_benchmark: bench,
      has_more: false,
      next_cursor: null,
    };
    renderWithCardProviders(<InvoiceCard invoice={invoice} />);
    const block = screen.getByTestId("invoice-card-yield");
    expect(block).toHaveTextContent("Yield 10%");
    expect(block).toContainElement(screen.getByTestId("benchmark-chip"));
  });
});
