import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import {
  ReturnsBreakdown,
  buildReturnsCsv,
  computeProRataFloorShare,
} from "../ReturnsBreakdown";
import * as api from "@/lib/api";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ address: "GAUSER111111111111111111111111111111111111111111111" }),
}));

const returnsFixture: api.InvoiceReturnsResponse = {
  invoice_id: "inv-1",
  calculation: "floor_division",
  settled_at: "2026-09-01T12:00:00Z",
  total_return_amount: 1150,
  returns: [
    {
      investor_wallet: "GA" + "B".repeat(54),
      share_percentage: 50,
      principal_invested: 1000,
      return_amount: 575,
      net_profit: 575,
    },
    {
      investor_wallet: "GAUSER111111111111111111111111111111111111111111111",
      share_percentage: 30,
      principal_invested: 600,
      return_amount: 345,
      net_profit: 345,
    },
    {
      investor_wallet: "GA" + "C".repeat(54),
      share_percentage: 20,
      principal_invested: 400,
      return_amount: 230,
      net_profit: 230,
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api, "fetchInvoiceReturns").mockResolvedValue(returnsFixture);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReturnsBreakdown invoiceId="inv-1" />
    </QueryClientProvider>,
  );
}

describe("ReturnsBreakdown (issue #284)", () => {
  it("renders the breakdown table for all investors", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("returns-table")).toBeInTheDocument();
    });
    for (const row of returnsFixture.returns) {
      expect(screen.getByTestId(`returns-row-${row.investor_wallet}`)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId(/^returns-row-/)).toHaveLength(3);
  });

  it("highlights the current user's row", async () => {
    renderComponent();
    await waitFor(() => screen.getByTestId("returns-table"));

    const ownRow = screen.getByTestId(
      `returns-row-GAUSER111111111111111111111111111111111111111111111`,
    );
    expect(ownRow.className).toMatch(/bg-primary\/10/);
  });

  it("shows a tooltip explaining the floor-division calculation", async () => {
    renderComponent();
    await waitFor(() => screen.getByTestId("returns-table"));

    expect(screen.getByTestId("returns-tooltip-content")).toBeInTheDocument();
    expect(screen.getByTestId("returns-tooltip-content").textContent).toMatch(
      /floor division/i,
    );
  });

  it("exports the breakdown to CSV", async () => {
    const createObjectUrl = vi.fn(() => "blob:mock");
    const revokeObjectUrl = vi.fn();
    // jsdom lacks URL.createObjectURL
    URL.createObjectURL = createObjectUrl as any;
    URL.revokeObjectURL = revokeObjectUrl as any;

    renderComponent();
    await waitFor(() => screen.getByTestId("returns-export-btn"));

    // Install these only after render: React appends its container to body.
    let appendedAnchor: HTMLAnchorElement | null = null;
    const appendSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => {
        appendedAnchor = node as HTMLAnchorElement;
        return node;
      });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    fireEvent.click(screen.getByTestId("returns-export-btn"));

    expect(createObjectUrl).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect((appendedAnchor as HTMLAnchorElement | null)?.download).toBe(
      "returns-inv-1.csv",
    );
    appendSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it("computes floor-division shares matching the backend", () => {
    // floor(1000 / 1000 * 1150) = 1150
    expect(computeProRataFloorShare(1000, 1000, 1150)).toBe(1150);
    // floor(333 / 1000 * 100) = floor(33.3) = 33 — fractional remainder dropped
    expect(computeProRataFloorShare(333, 1000, 100)).toBe(33);
    expect(computeProRataFloorShare(0, 1000, 100)).toBe(0);
  });

  it("exports a correctly formatted CSV", () => {
    const csv = buildReturnsCsv(returnsFixture.returns);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "investor_wallet,share_percentage,principal_invested,return_amount,net_profit",
    );
    expect(lines[1]).toBe(
      `GA${"B".repeat(54)},50.00,1000,575,575`,
    );
    expect(lines).toHaveLength(4);
  });
});
