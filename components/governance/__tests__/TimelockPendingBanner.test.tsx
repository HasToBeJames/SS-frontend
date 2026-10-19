import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TimelockPendingBanner, formatEtaCountdown } from "../TimelockPendingBanner";
import * as api from "@/lib/api";

function renderBanner() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TimelockPendingBanner />
    </QueryClientProvider>,
  );
}

const inFuture = (ms: number) => new Date(Date.now() + ms).toISOString();

beforeEach(() => window.sessionStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("formatEtaCountdown", () => {
  it("formats remaining time", () => {
    expect(formatEtaCountdown(90_061_000, 0)).toBe("1d 1h 1m 1s");
    expect(formatEtaCountdown(61_000, 0)).toBe("1m 1s");
    expect(formatEtaCountdown(0, 5000)).toBe("Ready to execute");
  });
});

describe("TimelockPendingBanner", () => {
  it("renders nothing when no changes are pending", async () => {
    const spy = vi.spyOn(api, "fetchPendingTimelockChanges").mockResolvedValue([]);
    renderBanner();
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.queryByTestId("timelock-banner")).not.toBeInTheDocument();
  });

  it("shows a single change with parameter, values and ETA", async () => {
    vi.spyOn(api, "fetchPendingTimelockChanges").mockResolvedValue([
      { id: "1", parameter: "Protocol fee", current_value: "1%", proposed_value: "2%", eta: inFuture(3_700_000) },
    ]);
    renderBanner();
    expect(await screen.findByTestId("timelock-banner")).toBeInTheDocument();
    expect(screen.getByText("Protocol fee")).toBeInTheDocument();
    expect(screen.getByText("2%")).toBeInTheDocument();
    expect(screen.getByTestId("timelock-change-eta")).toHaveTextContent(/1h 1m/);
  });

  it("updates the countdown every second", async () => {
    vi.spyOn(api, "fetchPendingTimelockChanges").mockResolvedValue([
      { id: "1", parameter: "Fee", current_value: "1", proposed_value: "2", eta: inFuture(120_000) },
    ]);
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    renderBanner();
    await screen.findByTestId("timelock-banner");
    const before = screen.getByTestId("timelock-change-eta").textContent;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId("timelock-change-eta").textContent).not.toBe(before);
  });

  it("expands a list for multiple changes", async () => {
    vi.spyOn(api, "fetchPendingTimelockChanges").mockResolvedValue([
      { id: "1", parameter: "Fee", current_value: "1", proposed_value: "2", eta: inFuture(100_000) },
      { id: "2", parameter: "Min investment", current_value: "10", proposed_value: "20", eta: inFuture(200_000) },
    ]);
    renderBanner();
    await screen.findByTestId("timelock-banner");
    expect(screen.queryAllByTestId("timelock-change-item")).toHaveLength(0);
    await userEvent.click(screen.getByTestId("timelock-banner-toggle"));
    expect(screen.getAllByTestId("timelock-change-item")).toHaveLength(2);
  });

  it("hides on dismiss and stays hidden for the session", async () => {
    vi.spyOn(api, "fetchPendingTimelockChanges").mockResolvedValue([
      { id: "1", parameter: "Fee", current_value: "1", proposed_value: "2", eta: inFuture(100_000) },
    ]);
    const first = renderBanner();
    await userEvent.click(await screen.findByTestId("timelock-banner-dismiss"));
    expect(screen.queryByTestId("timelock-banner")).not.toBeInTheDocument();
    first.unmount();

    const spy = api.fetchPendingTimelockChanges as unknown as { mock: { calls: unknown[] } };
    renderBanner();
    await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThan(1));
    expect(screen.queryByTestId("timelock-banner")).not.toBeInTheDocument();
  });
});
