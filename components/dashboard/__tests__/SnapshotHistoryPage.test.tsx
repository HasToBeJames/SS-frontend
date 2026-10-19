import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnapshotHistoryPage } from "../SnapshotHistoryPage";
import type { SnapshotDistribution } from "@/lib/snapshots";

const fetchSnapshotDistributions = vi.fn();
const claimSnapshot = vi.fn();

vi.mock("@/lib/snapshots", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/snapshots")>();
  return {
    ...actual,
    fetchSnapshotDistributions: (...a: unknown[]) => fetchSnapshotDistributions(...a),
    claimSnapshot: (...a: unknown[]) => claimSnapshot(...a),
  };
});
vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: "GWALLET", network: "testnet", isConnected: true }),
}));
vi.mock("@/hooks/useCurrency", () => ({
  useCurrency: () => ({ isConverted: false, convert: (n: number) => n, exchangeRate: null }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const snap = (over: Partial<SnapshotDistribution>): SnapshotDistribution => ({
  id: "s1",
  invoice_id: "inv-1",
  invoice_name: "Invoice One",
  snapshot_date: "2026-01-01T00:00:00Z",
  total_distributed: 1000,
  user_share: 100,
  claimed: false,
  ...over,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SnapshotHistoryPage />
    </QueryClientProvider>
  );
}

describe("SnapshotHistoryPage (issue #495)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    claimSnapshot.mockResolvedValue({ success: true });
  });

  it("shows an empty state when there are no snapshots", async () => {
    fetchSnapshotDistributions.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByTestId("snapshot-empty-state")).toBeInTheDocument();
    expect(fetchSnapshotDistributions).toHaveBeenCalledWith("GWALLET", expect.anything());
  });

  it("lists entitlements and claimed snapshots with received amount", async () => {
    fetchSnapshotDistributions.mockResolvedValue([
      snap({ id: "s1" }),
      snap({
        id: "s2",
        invoice_name: "Invoice Two",
        claimed: true,
        claimed_amount: 42,
        claimed_at: "2026-02-01T00:00:00Z",
      }),
    ]);
    renderPage();
    expect(await screen.findByTestId("snapshot-name-s1")).toHaveTextContent("Invoice One");
    expect(screen.getByTestId("snapshot-claim-s1")).toBeInTheDocument();
    expect(screen.getByTestId("snapshot-claimed-s2")).toHaveTextContent("42");
    expect(screen.queryByTestId("snapshot-claim-s2")).not.toBeInTheDocument();
  });

  it("claims one snapshot with the correct id", async () => {
    fetchSnapshotDistributions.mockResolvedValue([snap({ id: "s1" })]);
    renderPage();
    fireEvent.click(await screen.findByTestId("snapshot-claim-s1"));
    await waitFor(() => expect(claimSnapshot).toHaveBeenCalledWith("s1", "GWALLET"));
  });

  it("claims all unclaimed snapshots in sequence", async () => {
    fetchSnapshotDistributions.mockResolvedValue([
      snap({ id: "s1" }),
      snap({ id: "s2" }),
      snap({ id: "s3", claimed: true, claimed_amount: 5 }),
    ]);
    renderPage();
    fireEvent.click(await screen.findByTestId("snapshot-claim-all"));
    await waitFor(() => expect(claimSnapshot).toHaveBeenCalledTimes(2));
    expect(claimSnapshot.mock.calls.map((c) => c[0])).toEqual(["s1", "s2"]);
  });
});
