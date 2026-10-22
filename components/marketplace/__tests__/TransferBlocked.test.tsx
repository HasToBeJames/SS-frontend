import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransferBlocked } from "../TransferBlocked";
import { ACCESS_RESTRICTIONS } from "@/lib/restrictions";

describe("TransferBlocked", () => {
  it.each([
    ["kyc_required", "KYCRequired"],
    ["jurisdiction_blocked", "JurisdictionBlocked"],
    ["accreditation_required", "AccreditationRequired"],
  ] as const)("shows chip and help for %s", (restriction, key) => {
    render(<TransferBlocked restriction={restriction} onRetry={() => {}} />);
    expect(screen.getByTestId("transfer-blocked-chip")).toHaveTextContent(
      ACCESS_RESTRICTIONS[key].chipLabel,
    );
    expect(screen.getByTestId("transfer-blocked-help")).toHaveTextContent(
      ACCESS_RESTRICTIONS[key].guidance,
    );
  });

  it("calls onRetry and disables the button while retrying", async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<TransferBlocked restriction="kyc_required" onRetry={onRetry} />);
    await userEvent.click(screen.getByTestId("transfer-blocked-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<TransferBlocked restriction="kyc_required" onRetry={onRetry} isRetrying />);
    expect(screen.getByTestId("transfer-blocked-retry")).toBeDisabled();
  });
});
