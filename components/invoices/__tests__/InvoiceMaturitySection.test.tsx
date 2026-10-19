import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InvoiceMaturitySection } from "../InvoiceMaturitySection";

const fetchInvoiceEvents = vi.fn();

vi.mock("@/lib/maturity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/maturity")>();
  return { ...actual, fetchInvoiceEvents: (...a: unknown[]) => fetchInvoiceEvents(...a) };
});
vi.mock("@/hooks/useCurrency", () => ({
  useCurrency: () => ({ isConverted: false, convert: (n: number) => n, exchangeRate: null }),
}));

const DAY = 24 * 60 * 60 * 1000;
const MATURITY = "2026-01-01T00:00:00Z";
const at = (daysAfter: number) => Date.parse(MATURITY) + daysAfter * DAY - 1000;

function renderSection(daysAfter: number, extra: { penalty?: number | null } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <InvoiceMaturitySection
        invoiceId="inv-1"
        maturityDate={MATURITY}
        faceValue={10000}
        latePenaltyAccrued={extra.penalty}
        now={at(daysAfter)}
      />
    </QueryClientProvider>
  );
}

describe("InvoiceMaturitySection (issue #498)", () => {
  it("shows the grace bar within the 7-day window", async () => {
    fetchInvoiceEvents.mockResolvedValue([]);
    renderSection(3);
    expect(screen.getByTestId("maturity-status-chip")).toHaveTextContent("Grace period");
    expect(screen.getByTestId("grace-period-bar")).toHaveTextContent("3 of 7 days used");
    expect(screen.getByTestId("maturity-days-overdue")).toHaveTextContent("3");
    expect(screen.queryByTestId("late-penalty")).not.toBeInTheDocument();
  });

  it("shows the accrued late penalty past the grace period", async () => {
    fetchInvoiceEvents.mockResolvedValue([]);
    renderSection(10);
    expect(screen.getByTestId("maturity-status-chip")).toHaveTextContent("penalty");
    expect(screen.getByTestId("late-penalty-amount")).toHaveTextContent("30");
    expect(screen.queryByTestId("grace-period-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("default-countdown")).not.toBeInTheDocument();
  });

  it("prefers the API-reported penalty", () => {
    fetchInvoiceEvents.mockResolvedValue([]);
    renderSection(10, { penalty: 77 });
    expect(screen.getByTestId("late-penalty-amount")).toHaveTextContent("77");
  });

  it("shows the default countdown at 15+ days overdue", () => {
    fetchInvoiceEvents.mockResolvedValue([]);
    renderSection(16);
    expect(screen.getByTestId("default-countdown")).toHaveTextContent("14 days until");
  });

  it("surfaces maturity events in the activity feed", async () => {
    fetchInvoiceEvents.mockResolvedValue([
      { id: "e1", type: "MaturityMissed", timestamp: "2026-01-02T00:00:00Z" },
      { id: "e2", type: "PenaltyAccrued", timestamp: "2026-01-09T00:00:00Z", amount: 30 },
      { id: "e3", type: "Funded", timestamp: "2025-12-01T00:00:00Z" },
    ]);
    renderSection(10);
    await waitFor(() => expect(screen.getByTestId("maturity-event-e1")).toBeInTheDocument());
    expect(screen.getByTestId("maturity-event-e2")).toHaveTextContent("Late penalty accrued");
    expect(screen.queryByTestId("maturity-event-e3")).not.toBeInTheDocument();
  });
});
