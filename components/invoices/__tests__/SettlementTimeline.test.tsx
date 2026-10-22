import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useInterimPayments } from "@/hooks/useInterimPayments";
import type { InterimPaymentsResponse } from "@/lib/api";
import { SettlementTimeline } from "../SettlementTimeline";

vi.mock("@/hooks/useInterimPayments", () => ({
  useInterimPayments: vi.fn(),
}));

const mockedUseInterimPayments = vi.mocked(useInterimPayments);

type HookReturn = ReturnType<typeof useInterimPayments>;

const RESPONSE: InterimPaymentsResponse = {
  invoice_id: "inv-1",
  total_due: 10_000,
  payments: [
    { id: "p1", amount: 2_000, paid_at: "2026-01-05T00:00:00.000Z" },
    { id: "p2", amount: 3_000, paid_at: "2026-02-05T00:00:00.000Z" },
    {
      id: "p3",
      amount: 5_000,
      paid_at: "2026-03-05T00:00:00.000Z",
      is_final: true,
    },
  ],
};

function mockQuery(overrides: Partial<HookReturn> = {}) {
  mockedUseInterimPayments.mockReturnValue({
    data: RESPONSE,
    isLoading: false,
    isError: false,
    ...overrides,
  } as HookReturn);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SettlementTimeline (#478)", () => {
  it("renders each payment with its amount, cumulative total and remaining balance", () => {
    mockQuery();

    render(<SettlementTimeline invoiceId="inv-1" totalDue={10_000} />);

    expect(screen.getByTestId("settlement-entry-p1")).toBeInTheDocument();
    expect(screen.getByTestId("settlement-entry-amount-p1")).toHaveTextContent(
      "2,000 XLM",
    );
    expect(
      screen.getByTestId("settlement-entry-cumulative-p1"),
    ).toHaveTextContent("2,000 XLM");
    expect(
      screen.getByTestId("settlement-entry-remaining-p1"),
    ).toHaveTextContent("8,000 XLM");

    // Second instalment accumulates onto the first.
    expect(
      screen.getByTestId("settlement-entry-cumulative-p2"),
    ).toHaveTextContent("5,000 XLM");
    expect(
      screen.getByTestId("settlement-entry-remaining-p2"),
    ).toHaveTextContent("5,000 XLM");

    expect(screen.getByTestId("settlement-entry-date-p1")).toHaveTextContent(
      /2026/,
    );
  });

  it("shows the repayment progress against the total due", () => {
    mockQuery({
      data: {
        ...RESPONSE,
        payments: [RESPONSE.payments[0]],
      },
    });

    render(<SettlementTimeline invoiceId="inv-1" totalDue={10_000} />);

    expect(screen.getByTestId("settlement-repaid-percent")).toHaveTextContent(
      "20.0% repaid",
    );
    expect(screen.getByTestId("settlement-progress")).toHaveAttribute(
      "data-percent",
      "20",
    );
    expect(screen.getByTestId("settlement-remaining")).toHaveTextContent(
      "8,000 XLM remaining",
    );
  });

  it("badges the final settlement entry as Settled", () => {
    mockQuery();

    render(<SettlementTimeline invoiceId="inv-1" totalDue={10_000} />);

    const badge = screen.getByTestId("settlement-final-badge");
    expect(badge).toHaveTextContent("Settled");
    // The badge belongs to the last (final) entry only.
    expect(screen.getByTestId("settlement-entry-p3")).toContainElement(badge);
    expect(screen.getByTestId("settlement-entry-p3")).toHaveAttribute(
      "data-final",
      "true",
    );
    expect(screen.getByTestId("settlement-entry-p1")).toHaveAttribute(
      "data-final",
      "false",
    );
  });

  it("shows the empty state when no payments have been made", () => {
    mockQuery({
      data: { invoice_id: "inv-1", total_due: 10_000, payments: [] },
    });

    render(<SettlementTimeline invoiceId="inv-1" totalDue={10_000} />);

    expect(
      screen.getByTestId("settlement-timeline-empty"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settlement-progress")).toHaveAttribute(
      "data-percent",
      "0",
    );
  });

  it("renders a loading skeleton while the contract query is in flight", () => {
    mockQuery({ data: undefined, isLoading: true });

    render(<SettlementTimeline invoiceId="inv-1" totalDue={10_000} />);

    expect(
      screen.getByTestId("settlement-timeline-loading"),
    ).toBeInTheDocument();
  });

  it("renders an error state when the contract query fails", () => {
    mockQuery({ data: undefined, isError: true });

    render(<SettlementTimeline invoiceId="inv-1" totalDue={10_000} />);

    expect(screen.getByTestId("settlement-timeline-error")).toBeInTheDocument();
  });
});
