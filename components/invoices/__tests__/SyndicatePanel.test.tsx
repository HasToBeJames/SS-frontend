import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SyndicatePanel } from "../SyndicatePanel";
import type { Syndicate } from "@/lib/api";

const mockQuery = vi.fn();
const mockMutate = vi.fn();
let mockAddress: string | null = "GCO1";

vi.mock("@/hooks/useSyndicate", () => ({
  useInvoiceSyndicate: () => mockQuery(),
  useSyndicateMutation: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: mockAddress, isConnected: mockAddress !== null }),
}));

const syndicate: Syndicate = {
  id: "s1",
  invoice_id: "inv-1",
  lead: "GLEAD",
  min_co_invest: 100,
  target: 1000,
  committed: 400,
  members: [
    { address: "GLEAD", amount: 300 },
    { address: "GCO1", amount: 100 },
  ],
  status: "open",
};

describe("SyndicatePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddress = "GCO1";
  });

  it("renders nothing for ineligible invoices", () => {
    mockQuery.mockReturnValue({ data: { eligible: false, syndicate: null }, isLoading: false });
    const { container } = render(<SyndicatePanel invoiceId="inv-1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("submits create_syndicate with the minimum co-invest", () => {
    mockAddress = "GLEAD";
    mockQuery.mockReturnValue({ data: { eligible: true, syndicate: null }, isLoading: false });
    render(<SyndicatePanel invoiceId="inv-1" />);

    fireEvent.change(screen.getByTestId("syndicate-min-input"), { target: { value: "250" } });
    fireEvent.click(screen.getByTestId("create-syndicate-submit"));

    expect(mockMutate).toHaveBeenCalledWith({
      method: "create_syndicate",
      wallet: "GLEAD",
      min_co_invest: 250,
    });
  });

  it("blocks joining below min_co_invest with a clear error", () => {
    mockAddress = "GNEW";
    mockQuery.mockReturnValue({ data: { eligible: true, syndicate }, isLoading: false });
    render(<SyndicatePanel invoiceId="inv-1" />);

    fireEvent.change(screen.getByTestId("syndicate-join-input"), { target: { value: "50" } });
    fireEvent.click(screen.getByTestId("join-syndicate-submit"));

    expect(screen.getByTestId("syndicate-join-error")).toHaveTextContent(/below the minimum/);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("submits join_syndicate for a valid amount", () => {
    mockAddress = "GNEW";
    mockQuery.mockReturnValue({ data: { eligible: true, syndicate }, isLoading: false });
    render(<SyndicatePanel invoiceId="inv-1" />);

    fireEvent.change(screen.getByTestId("syndicate-join-input"), { target: { value: "150" } });
    fireEvent.click(screen.getByTestId("join-syndicate-submit"));

    expect(mockMutate).toHaveBeenCalledWith({
      method: "join_syndicate",
      wallet: "GNEW",
      amount: 150,
    });
  });

  it("shows committed total, member count and gap", () => {
    mockQuery.mockReturnValue({ data: { eligible: true, syndicate }, isLoading: false });
    render(<SyndicatePanel invoiceId="inv-1" />);

    expect(screen.getByTestId("syndicate-committed")).toHaveTextContent("400 XLM");
    expect(screen.getByTestId("syndicate-member-count")).toHaveTextContent("2");
    expect(screen.getByTestId("syndicate-gap")).toHaveTextContent("600 XLM");
  });

  it("submits exit_syndicate for a co-investor", () => {
    mockQuery.mockReturnValue({ data: { eligible: true, syndicate }, isLoading: false });
    render(<SyndicatePanel invoiceId="inv-1" />);

    fireEvent.click(screen.getByTestId("exit-syndicate-button"));
    expect(mockMutate).toHaveBeenCalledWith({ method: "exit_syndicate", wallet: "GCO1" });
  });

  it("shows Execute to the lead once the target is met", () => {
    mockAddress = "GLEAD";
    mockQuery.mockReturnValue({
      data: { eligible: true, syndicate: { ...syndicate, committed: 1000 } },
      isLoading: false,
    });
    render(<SyndicatePanel invoiceId="inv-1" />);
    expect(screen.getByTestId("execute-syndicate-button")).toBeInTheDocument();
  });

  it("hides Execute from the lead while the target is unmet", () => {
    mockAddress = "GLEAD";
    mockQuery.mockReturnValue({ data: { eligible: true, syndicate }, isLoading: false });
    render(<SyndicatePanel invoiceId="inv-1" />);
    expect(screen.queryByTestId("execute-syndicate-button")).toBeNull();
  });

  it("hides Execute from a co-investor even when the target is met", () => {
    mockAddress = "GCO1";
    mockQuery.mockReturnValue({
      data: { eligible: true, syndicate: { ...syndicate, committed: 1000 } },
      isLoading: false,
    });
    render(<SyndicatePanel invoiceId="inv-1" />);
    expect(screen.queryByTestId("execute-syndicate-button")).toBeNull();
  });
});
