import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertPreferencesSettings } from "../AlertPreferencesSettings";
import { fetchAlertPreferences, setAlertPreferences } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/context/WalletContext", () => ({ useWallet: vi.fn() }));
vi.mock("@/hooks/useActivity", () => ({
  useUpcomingMaturities: () => ({ data: [], isLoading: false, isError: false }),
}));
vi.mock("@/lib/api", () => ({
  fetchAlertPreferences: vi.fn(),
  setAlertPreferences: vi.fn(),
}));

const KEYS = ["settlement", "kyc_expiry", "watchlist_change", "auto_invest", "maturity_approaching"];

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AlertPreferencesSettings />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useWallet).mockReturnValue({ address: "GWALLET", isConnected: true } as ReturnType<typeof useWallet>);
});

describe("AlertPreferencesSettings (#531)", () => {
  it("loads saved preferences into the five toggles", async () => {
    vi.mocked(fetchAlertPreferences).mockResolvedValue({
      settlement: false,
      kyc_expiry: true,
      watchlist_change: false,
      auto_invest: true,
      maturity_approaching: true,
    });
    renderPanel();

    await screen.findByTestId("alert-toggle-settlement");
    expect(fetchAlertPreferences).toHaveBeenCalledWith("GWALLET");
    expect(screen.getByTestId("alert-toggle-settlement")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("alert-toggle-kyc_expiry")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("alert-toggle-watchlist_change")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("alert-toggle-auto_invest")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("alert-toggle-maturity_approaching")).toHaveAttribute("aria-checked", "true");
  });

  it("shows all toggles enabled for a wallet with no saved preferences", async () => {
    vi.mocked(fetchAlertPreferences).mockResolvedValue(null);
    renderPanel();

    for (const key of KEYS) {
      expect(await screen.findByTestId(`alert-toggle-${key}`)).toHaveAttribute("aria-checked", "true");
    }
  });

  it("saves every toggle state and fires the saved toast", async () => {
    vi.mocked(fetchAlertPreferences).mockResolvedValue(null);
    vi.mocked(setAlertPreferences).mockResolvedValue({ success: true });
    renderPanel();

    await userEvent.click(await screen.findByTestId("alert-toggle-kyc_expiry"));
    await userEvent.click(screen.getByTestId("alert-preferences-save"));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Alert preferences saved"));
    expect(setAlertPreferences).toHaveBeenCalledWith("GWALLET", {
      settlement: true,
      kyc_expiry: false,
      watchlist_change: true,
      auto_invest: true,
      maturity_approaching: true,
      maturity_reminder_days: [30, 14, 7, 1],
    });
  });

  it("shows an error toast when the contract call fails", async () => {
    vi.mocked(fetchAlertPreferences).mockResolvedValue(null);
    vi.mocked(setAlertPreferences).mockRejectedValue(new Error("boom"));
    renderPanel();

    await userEvent.click(await screen.findByTestId("alert-preferences-save"));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("asks for a wallet when disconnected", () => {
    vi.mocked(useWallet).mockReturnValue({ address: null, isConnected: false } as ReturnType<typeof useWallet>);
    renderPanel();
    expect(screen.getByTestId("alert-preferences-connect")).toBeInTheDocument();
    expect(fetchAlertPreferences).not.toHaveBeenCalled();
  });

  it("saves the maturity reminder intervals the user toggled (#542)", async () => {
    vi.mocked(fetchAlertPreferences).mockResolvedValue({ maturity_reminder_days: [30, 7] });
    vi.mocked(setAlertPreferences).mockResolvedValue({ success: true });
    renderPanel();

    await userEvent.click(await screen.findByTestId("maturity-reminder-toggle-14"));
    await userEvent.click(screen.getByTestId("maturity-reminder-toggle-7"));
    await userEvent.click(screen.getByTestId("alert-preferences-save"));

    await waitFor(() => expect(setAlertPreferences).toHaveBeenCalled());
    expect(vi.mocked(setAlertPreferences).mock.calls[0][1]).toMatchObject({
      maturity_reminder_days: [30, 14],
    });
  });
});
