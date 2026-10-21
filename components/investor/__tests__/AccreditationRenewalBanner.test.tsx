import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAccreditationStatus } from "@/hooks/useAccreditationStatus";
import { AccreditationRenewalBanner } from "../AccreditationRenewalBanner";

vi.mock("@/hooks/useAccreditationStatus", () => ({
  useAccreditationStatus: vi.fn(),
}));

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-01T00:00:00Z");

function withExpiry(expiresAt: string | null) {
  vi.mocked(useAccreditationStatus).mockReturnValue({
    data: { wallet: "GINV", tier: "accredited", high_value_threshold: 100_000, expires_at: expiresAt },
  } as unknown as ReturnType<typeof useAccreditationStatus>);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("AccreditationRenewalBanner (#543)", () => {
  it("renders nothing when the expiry is more than 60 days away", () => {
    withExpiry(new Date(NOW + 90 * DAY).toISOString());
    render(<AccreditationRenewalBanner />);
    expect(screen.queryByTestId("accreditation-renewal-banner")).not.toBeInTheDocument();
  });

  it("shows the countdown and a renew CTA inside the 60-day window", () => {
    withExpiry(new Date(NOW + 20 * DAY + 4 * 60 * 60 * 1000).toISOString());
    render(<AccreditationRenewalBanner />);

    const banner = screen.getByTestId("accreditation-renewal-banner");
    expect(banner).toHaveAttribute("data-severity", "warning");
    expect(screen.getByTestId("accreditation-renewal-countdown")).toHaveTextContent("20d 4h");
    expect(screen.getByRole("link", { name: "Renew now" })).toHaveAttribute(
      "href",
      "/profile#accreditation",
    );
  });

  it("escalates to the critical style within 7 days", () => {
    withExpiry(new Date(NOW + 2 * DAY).toISOString());
    render(<AccreditationRenewalBanner />);
    expect(screen.getByTestId("accreditation-renewal-banner")).toHaveAttribute(
      "data-severity",
      "critical",
    );
  });

  it("renders nothing when the backend has not reported an expiry", () => {
    withExpiry(null);
    render(<AccreditationRenewalBanner />);
    expect(screen.queryByTestId("accreditation-renewal-banner")).not.toBeInTheDocument();
  });
});
