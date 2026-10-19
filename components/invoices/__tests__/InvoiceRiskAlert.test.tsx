import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { InvoiceRiskAlert } from "../InvoiceRiskAlert";
import * as api from "@/lib/api";

function renderAlert() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><InvoiceRiskAlert invoiceId="inv-1" /></QueryClientProvider>);
}

describe("InvoiceRiskAlert", () => {
  it.each([
    ["funding_risk", "low", "Funding Risk"],
    ["late_payment", "medium", "Late Payment"],
    ["default_proximity", "high", "Default Proximity"],
  ] as const)("renders %s with %s severity", async (risk_type, severity, label) => {
    vi.spyOn(api, "fetchInvoiceRiskStatus").mockResolvedValue({ active: true, risk_type, severity, recommended_action: "Review exposure" });
    renderAlert();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(label);
    expect(alert).toHaveAttribute("data-severity", severity);
  });

  it("disappears when the risk resolves", async () => {
    vi.spyOn(api, "fetchInvoiceRiskStatus").mockResolvedValue({ active: false, risk_type: null, severity: null, recommended_action: null });
    renderAlert();
    await vi.waitFor(() => expect(api.fetchInvoiceRiskStatus).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
