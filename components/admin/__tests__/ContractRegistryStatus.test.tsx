import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { ContractRegistryStatus } from "../ContractRegistryStatus";
import * as api from "@/lib/api";

function renderRegistry() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ContractRegistryStatus token="admin-token" /></QueryClientProvider>);
}

describe("ContractRegistryStatus", () => {
  it("shows registry fields and newest upgrades first", async () => {
    vi.spyOn(api, "fetchContractRegistry").mockResolvedValue({ contracts: [{ name: "Invoice", current_version: "2.0.0", address: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", last_upgraded_at: "2026-10-01T00:00:00Z", compatibility_status: "current" }], recent_upgrades: [{ id: "old", contract_name: "Invoice", from_version: "1.0.0", to_version: "1.1.0", upgraded_at: "2026-08-01T00:00:00Z" }, { id: "new", contract_name: "Invoice", from_version: "1.1.0", to_version: "2.0.0", upgraded_at: "2026-10-01T00:00:00Z" }] });
    renderRegistry();
    expect(await screen.findByText("2.0.0")).toBeInTheDocument();
    const timeline = screen.getByTestId("upgrade-timeline");
    expect(timeline.textContent?.indexOf("1.1.0 → 2.0.0")).toBeLessThan(timeline.textContent?.indexOf("1.0.0 → 1.1.0") ?? 0);
  });

  it("shows access denied on a 403", async () => {
    vi.spyOn(api, "fetchContractRegistry").mockRejectedValue(new api.ApiForbiddenError());
    renderRegistry();
    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
  });
});
