import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReferralTierPanel } from "../ReferralTierPanel";
import type { ReferralTierStatus } from "@/lib/api";

const mockTier = vi.fn();
const mockWallet = vi.fn();

vi.mock("@/hooks/useReferralTier", () => ({
  useReferralTier: () => mockTier(),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => mockWallet(),
}));

const tiers: ReferralTierStatus["tiers"] = [
  { tier: "standard", threshold: 0, commission_rate: 2 },
  { tier: "plus", threshold: 10000, commission_rate: 4 },
  { tier: "elite", threshold: 50000, commission_rate: 6 },
];

function tier(overrides: Partial<ReferralTierStatus> = {}) {
  mockTier.mockReturnValue({
    data: {
      tier: "standard",
      cumulative_referred_volume: 4000,
      tiers,
      ...overrides,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

describe("ReferralTierPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWallet.mockReturnValue({ address: "GINV", isConnected: true });
  });

  it("prompts to connect a wallet when disconnected", () => {
    mockWallet.mockReturnValue({ address: null, isConnected: false });
    tier();
    render(<ReferralTierPanel />);
    expect(screen.getByTestId("referral-tier-connect")).toBeInTheDocument();
    expect(screen.queryByTestId("referral-tier-badge")).toBeNull();
  });

  it("shows the current tier, commission rate and cumulative volume", () => {
    tier({ tier: "plus", cumulative_referred_volume: 25000 });
    render(<ReferralTierPanel />);
    expect(screen.getByTestId("referral-tier-badge")).toHaveTextContent("Plus");
    expect(screen.getByTestId("referral-commission-rate")).toHaveTextContent("4%");
    expect(screen.getByTestId("referral-cumulative-volume")).toHaveTextContent("25,000 XLM");
  });

  it("shows progress toward the next tier", () => {
    tier({ tier: "plus", cumulative_referred_volume: 30000 });
    render(<ReferralTierPanel />);
    expect(screen.getByTestId("referral-tier-progress-percent")).toHaveTextContent("50%");
    expect(screen.getByTestId("referral-tier-remaining")).toHaveTextContent(
      "20,000 XLM more referred volume to reach Elite",
    );
  });

  it("shows the max tier state without a progress bar", () => {
    tier({ tier: "elite", cumulative_referred_volume: 60000 });
    render(<ReferralTierPanel />);
    expect(screen.getByTestId("referral-max-tier")).toHaveTextContent("Max Tier Reached");
    expect(screen.queryByTestId("referral-tier-progress-bar")).toBeNull();
  });

  it("renders a commission row for every tier", () => {
    tier();
    render(<ReferralTierPanel />);
    for (const name of ["standard", "plus", "elite"]) {
      expect(screen.getByTestId(`referral-tier-row-${name}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId("referral-tier-row-plus")).toHaveTextContent("4%");
  });

  it("shows an error state when the tier cannot be loaded", () => {
    mockTier.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    render(<ReferralTierPanel />);
    expect(screen.getByTestId("referral-tier-error")).toBeInTheDocument();
  });

  it("shows a loading state while the tier is fetched", () => {
    mockTier.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    render(<ReferralTierPanel />);
    expect(screen.getByTestId("referral-tier-loading")).toBeInTheDocument();
  });
});
