import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IssuerReputationHeaderBadge, IssuerReputationPanel } from "../IssuerReputationPanel";
import { getReputationTier } from "@/lib/reputation";
import * as api from "@/lib/api";

function renderWith(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("getReputationTier", () => {
  it.each([
    [null, "unrated"],
    [0, "bronze"],
    [39, "bronze"],
    [40, "silver"],
    [59, "silver"],
    [60, "gold"],
    [79, "gold"],
    [80, "platinum"],
    [100, "platinum"],
  ])("maps %s to %s", (score, tier) => {
    expect(getReputationTier(score).id).toBe(tier);
  });
});

describe("IssuerReputationPanel", () => {
  it("shows a skeleton while loading", () => {
    vi.spyOn(api, "fetchIssuerReputation").mockReturnValue(new Promise(() => {}));
    renderWith(<IssuerReputationPanel wallet="G1" />);
    expect(screen.getByTestId("issuer-reputation-loading")).toBeInTheDocument();
  });

  it("renders history newest first with deltas", async () => {
    vi.spyOn(api, "fetchIssuerReputation").mockResolvedValue({
      wallet: "G1",
      score: 72,
      history: [
        { id: "a", event_type: "settled_on_time", date: "2026-01-10T00:00:00Z", score_delta: 5 },
        { id: "b", event_type: "defaulted", date: "2026-03-10T00:00:00Z", score_delta: -20 },
        { id: "c", event_type: "settled_late", date: "2026-02-10T00:00:00Z", score_delta: -2 },
      ],
    });
    renderWith(<IssuerReputationPanel wallet="G1" />);
    const items = await screen.findAllByTestId("reputation-history-item");
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringContaining("Defaulted"),
      expect.stringContaining("Settled late"),
      expect.stringContaining("Settled on time"),
    ]);
    const deltas = screen.getAllByTestId("reputation-delta").map((d) => d.textContent);
    expect(deltas).toEqual(["-20", "-2", "+5"]);
  });
});

describe("IssuerReputationHeaderBadge", () => {
  it("shows tier name, score and tier thresholds on hover", async () => {
    vi.spyOn(api, "fetchIssuerReputation").mockResolvedValue({ wallet: "G1", score: 85, history: [] });
    renderWith(<IssuerReputationHeaderBadge wallet="G1" />);
    const badge = await screen.findByTestId("reputation-badge");
    expect(badge).toHaveAttribute("data-tier", "platinum");
    expect(screen.getByTestId("reputation-tier-name")).toHaveTextContent("Platinum");
    expect(screen.getByTestId("reputation-score")).toHaveTextContent("85");

    await userEvent.hover(badge);
    const tips = await screen.findAllByTestId("tier-threshold-gold");
    expect(tips[0]).toHaveTextContent("Gold: 60–79");
  });

  it("shows an Unrated badge when there is no score", async () => {
    vi.spyOn(api, "fetchIssuerReputation").mockResolvedValue({ wallet: "G1", score: null, history: [] });
    renderWith(<IssuerReputationHeaderBadge wallet="G1" />);
    expect(await screen.findByTestId("reputation-tier-name")).toHaveTextContent("Unrated");
    expect(screen.queryByTestId("reputation-score")).not.toBeInTheDocument();
  });
});
