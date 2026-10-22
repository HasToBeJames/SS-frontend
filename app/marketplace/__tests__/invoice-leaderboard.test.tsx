import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InvoiceLeaderboardPage from "../invoice-leaderboard/page";
import { fetchInvoiceLeaderboard, type InvoiceLeaderboardEntry } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  fetchInvoiceLeaderboard: vi.fn(),
}));
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const row = (id: string, value: number, sector: string): InvoiceLeaderboardEntry => ({
  invoice_id: id,
  invoice_name: `Invoice ${id}`,
  issuer: `Issuer ${id}`,
  metric_value: value,
  sector,
});

const DATA: Record<string, InvoiceLeaderboardEntry[]> = {
  yield_rate: [row("a", 14.2, "sme"), row("b", 12.5, "real_estate"), row("c", 11, "sme")],
  settlement_speed: [row("d", 3, "sme"), row("e", 5.5, "real_estate")],
  issuer_reputation: [row("f", 96, "trade_finance")],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <InvoiceLeaderboardPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchInvoiceLeaderboard).mockImplementation(async (metric) => DATA[metric]);
});

describe("InvoiceLeaderboardPage (#527)", () => {
  it("renders the ranked yield list with issuer, value and sector", async () => {
    renderPage();
    expect(await screen.findByTestId("leaderboard-row-a")).toBeInTheDocument();
    expect(fetchInvoiceLeaderboard).toHaveBeenCalledWith("yield_rate");
    expect(screen.getByTestId("leaderboard-position-1")).toHaveTextContent("#1");
    expect(screen.getByTestId("leaderboard-value-a")).toHaveTextContent("14.2%");
    expect(screen.getByTestId("leaderboard-row-a")).toHaveTextContent("Issuer a");
    expect(screen.getByTestId("leaderboard-row-a")).toHaveTextContent("SME");
  });

  it("refetches and re-renders when the metric tab changes", async () => {
    renderPage();
    await screen.findByTestId("leaderboard-row-a");

    await userEvent.click(screen.getByTestId("leaderboard-tab-settlement_speed"));
    expect(await screen.findByTestId("leaderboard-row-d")).toBeInTheDocument();
    expect(fetchInvoiceLeaderboard).toHaveBeenLastCalledWith("settlement_speed");
    expect(screen.getByTestId("leaderboard-value-d")).toHaveTextContent("3.0 days");
    expect(screen.queryByTestId("leaderboard-row-a")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("leaderboard-tab-issuer_reputation"));
    expect(await screen.findByTestId("leaderboard-value-f")).toHaveTextContent("96/100");
    expect(fetchInvoiceLeaderboard).toHaveBeenLastCalledWith("issuer_reputation");
  });

  it("narrows the list with the sector chips", async () => {
    renderPage();
    await screen.findByTestId("leaderboard-row-a");

    await userEvent.click(screen.getByTestId("leaderboard-sector-real_estate"));
    await waitFor(() => expect(screen.queryByTestId("leaderboard-row-a")).not.toBeInTheDocument());
    expect(screen.getByTestId("leaderboard-row-b")).toBeInTheDocument();
    expect(screen.getByTestId("leaderboard-position-2")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("leaderboard-sector-infrastructure"));
    expect(await screen.findByTestId("leaderboard-empty")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("leaderboard-sector-all"));
    expect(await screen.findByTestId("leaderboard-row-c")).toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    vi.mocked(fetchInvoiceLeaderboard).mockRejectedValue(new Error("nope"));
    renderPage();
    expect(await screen.findByTestId("leaderboard-error")).toBeInTheDocument();
  });
});
