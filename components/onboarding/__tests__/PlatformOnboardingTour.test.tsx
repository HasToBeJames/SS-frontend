import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PlatformOnboardingTour, ONBOARDING_TOUR_STEPS } from "@/components/onboarding/PlatformOnboardingTour";
import { RestartTourSettings } from "@/components/settings/RestartTourSettings";
import { ONBOARDING_TOUR_STORAGE_KEY } from "@/hooks/useOnboardingTour";

let connected = false;
vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ isConnected: connected }),
}));

async function mount() {
  vi.useFakeTimers();
  const view = render(
    <>
      <a data-tour="marketplace" href="/marketplace">Marketplace</a>
      <PlatformOnboardingTour />
      <RestartTourSettings />
    </>,
  );
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
  return view;
}

describe("PlatformOnboardingTour (#505)", () => {
  beforeEach(() => {
    localStorage.clear();
    connected = true;
    vi.useRealTimers();
  });

  it("has the six steps in order", () => {
    expect(ONBOARDING_TOUR_STEPS.map((s) => s.id)).toEqual([
      "welcome",
      "marketplace",
      "invoice-detail",
      "invest-flow",
      "portfolio",
      "secondary-market",
    ]);
  });

  it("starts on wallet connection when never completed", async () => {
    await mount();
    expect(screen.getByTestId("onboarding-tour")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-step-count")).toHaveTextContent("Step 1 of 6");
  });

  it("does not start without a connected wallet", async () => {
    connected = false;
    await mount();
    expect(screen.queryByTestId("onboarding-tour")).not.toBeInTheDocument();
  });

  it("walks all steps and stores completion on finish", async () => {
    await mount();
    for (let i = 1; i < ONBOARDING_TOUR_STEPS.length; i++) {
      fireEvent.click(screen.getByTestId("onboarding-next"));
      expect(screen.getByTestId("onboarding-step-title")).toHaveTextContent(
        ONBOARDING_TOUR_STEPS[i].title,
      );
    }
    expect(screen.getByTestId("onboarding-next")).toHaveTextContent("Finish");
    fireEvent.click(screen.getByTestId("onboarding-next"));
    expect(screen.queryByTestId("onboarding-tour")).not.toBeInTheDocument();
    expect(localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBe("true");
  });

  it("skip on any step ends the tour and marks it complete", async () => {
    await mount();
    fireEvent.click(screen.getByTestId("onboarding-next"));
    fireEvent.click(screen.getByTestId("onboarding-next"));
    fireEvent.click(screen.getByTestId("onboarding-skip"));
    expect(screen.queryByTestId("onboarding-tour")).not.toBeInTheDocument();
    expect(localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBe("true");
  });

  it("does not relaunch once completed", async () => {
    localStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, "true");
    await mount();
    expect(screen.queryByTestId("onboarding-tour")).not.toBeInTheDocument();
  });

  it("restart in settings relaunches from step 1", async () => {
    localStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, "true");
    await mount();
    fireEvent.click(screen.getByTestId("restart-tour-button"));
    expect(localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId("onboarding-step-count")).toHaveTextContent("Step 1 of 6");
  });
});
