import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingBonusChip } from "../OnboardingBonusChip";
import { useOnboardingBonus } from "@/hooks/useOnboardingBonus";

vi.mock("@/hooks/useOnboardingBonus", () => ({
  useOnboardingBonus: vi.fn(),
  ONBOARDING_BONUS_QUERY_KEY: ["onboarding-bonus"],
}));

const mocked = vi.mocked(useOnboardingBonus);

function setData(data: unknown) {
  mocked.mockReturnValue({ data } as ReturnType<typeof useOnboardingBonus>);
}

beforeEach(() => vi.clearAllMocks());

describe("OnboardingBonusChip (#529)", () => {
  it("shows +0.5% for an unclaimed eligible wallet", () => {
    setData({ is_claimed: false });
    render(<OnboardingBonusChip />);
    expect(screen.getByTestId("onboarding-bonus-chip")).toHaveTextContent(
      "+0.5% bonus yield on first investment",
    );
  });

  it("uses the bonus returned by the API", () => {
    setData({ is_claimed: false, bonus_yield_bps: 75 });
    render(<OnboardingBonusChip />);
    expect(screen.getByTestId("onboarding-bonus-chip")).toHaveTextContent("+0.75% bonus yield");
  });

  it("explains the one-time bonus and eligibility in the tooltip", async () => {
    setData({ is_claimed: false });
    render(<OnboardingBonusChip />);
    await userEvent.hover(screen.getByTestId("onboarding-bonus-chip"));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("One-time onboarding bonus");
    expect(tooltip).toHaveTextContent("never invested");
  });

  it("is hidden once the bonus is claimed", () => {
    setData({ is_claimed: true });
    render(<OnboardingBonusChip />);
    expect(screen.queryByTestId("onboarding-bonus-chip")).not.toBeInTheDocument();
  });

  it("is hidden for unknown wallets and while disconnected or loading", () => {
    setData(null);
    const { rerender } = render(<OnboardingBonusChip />);
    expect(screen.queryByTestId("onboarding-bonus-chip")).not.toBeInTheDocument();
    setData(undefined);
    rerender(<OnboardingBonusChip />);
    expect(screen.queryByTestId("onboarding-bonus-chip")).not.toBeInTheDocument();
  });
});
