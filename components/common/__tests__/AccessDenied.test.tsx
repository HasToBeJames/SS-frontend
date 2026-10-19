import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccessDenied } from "../AccessDenied";
import { ACCESS_RESTRICTIONS, type AccessRestrictionType } from "@/lib/restrictions";

const CASES: [AccessRestrictionType, string | null, string | null][] = [
  ["KYCRequired", "Upgrade KYC", "/kyc/upgrade"],
  ["JurisdictionBlocked", "Contact Support", "/help"],
  ["AccreditationRequired", "Apply for Accreditation", "/kyc/accreditation"],
  ["SignerOnly", null, null],
];

describe("AccessDenied", () => {
  it.each(CASES)("renders %s content and CTA", (type, label, href) => {
    render(<AccessDenied restriction={type} />);
    expect(screen.getByTestId("access-denied-heading")).toHaveTextContent(
      ACCESS_RESTRICTIONS[type].heading,
    );
    expect(screen.getByTestId("access-denied-explanation")).toHaveTextContent(
      ACCESS_RESTRICTIONS[type].explanation,
    );
    expect(screen.getByTestId("access-denied-icon")).toBeInTheDocument();

    if (label && href) {
      const cta = screen.getByRole("link", { name: label });
      expect(cta).toHaveAttribute("href", href);
    } else {
      expect(screen.queryByTestId("access-denied-cta")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    }
  });
});
