import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceFraudReport } from "../InvoiceFraudReport";
import * as api from "@/lib/api";

vi.mock("@/context/WalletContext", () => ({ useWallet: () => ({ address: "GINVESTOR" }) }));

function renderReport(isInvestor = true) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><InvoiceFraudReport invoiceId="inv-1" isInvestor={isInvestor} /></QueryClientProvider>);
}

describe("InvoiceFraudReport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchInvoiceReportStatus").mockResolvedValue({ active_reports: 0, reported_by_wallet: false });
  });

  it("is only visible to investors", () => {
    renderReport(false);
    expect(screen.queryByTestId("report-invoice")).not.toBeInTheDocument();
  });

  it("offers the required reasons and submits a hashed optional description", async () => {
    const submit = vi.spyOn(api, "submitInvoiceReport").mockResolvedValue({ report_id: "report-1" });
    renderReport();
    fireEvent.click(await screen.findByTestId("report-invoice"));
    const select = screen.getByTestId("report-reason");
    expect(select).toHaveTextContent("Misrepresentation");
    expect(select).toHaveTextContent("False Documents");
    expect(select).toHaveTextContent("Non-Delivery");
    expect(select).toHaveTextContent("Other");
    fireEvent.change(select, { target: { value: "false_documents" } });
    fireEvent.change(screen.getByTestId("report-evidence"), { target: { value: "proof" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit report" }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith("inv-1", expect.objectContaining({ reason: "false_documents", evidence_hash: expect.stringMatching(/^[a-f0-9]{64}$/), wallet: "GINVESTOR" })));
  });

  it("shows the submitted state for a wallet that already reported", async () => {
    vi.spyOn(api, "fetchInvoiceReportStatus").mockResolvedValue({ active_reports: 1, reported_by_wallet: true });
    renderReport();
    expect(await screen.findByTestId("report-submitted")).toBeDisabled();
  });
});
