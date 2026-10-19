/**
 * Access and transfer restriction metadata shared by the AccessDenied page
 * and the secondary-market TransferBlocked state.
 */

export type AccessRestrictionType =
  | "KYCRequired"
  | "JurisdictionBlocked"
  | "AccreditationRequired"
  | "SignerOnly";

export interface AccessRestrictionCta {
  label: string;
  href: string;
}

export interface AccessRestrictionConfig {
  heading: string;
  explanation: string;
  /** Short label used by compact surfaces such as the restriction chip. */
  chipLabel: string;
  /** Resolution steps, shown where there is room for guidance. */
  guidance: string;
  cta: AccessRestrictionCta | null;
}

export const KYC_UPGRADE_ROUTE = "/kyc/upgrade";
export const SUPPORT_ROUTE = "/help";
export const ACCREDITATION_ROUTE = "/kyc/accreditation";

export const ACCESS_RESTRICTIONS: Record<AccessRestrictionType, AccessRestrictionConfig> = {
  KYCRequired: {
    heading: "Identity verification required",
    explanation:
      "Your wallet has not completed the KYC tier needed for this feature.",
    chipLabel: "KYC Required",
    guidance:
      "Complete or upgrade your KYC verification, then come back and retry. Approval usually appears within a few minutes.",
    cta: { label: "Upgrade KYC", href: KYC_UPGRADE_ROUTE },
  },
  JurisdictionBlocked: {
    heading: "Not available in your region",
    explanation:
      "This feature is restricted for the jurisdiction linked to your wallet.",
    chipLabel: "Jurisdiction Blocked",
    guidance:
      "If your registered jurisdiction is wrong, contact support with proof of residence so it can be reviewed.",
    cta: { label: "Contact Support", href: SUPPORT_ROUTE },
  },
  AccreditationRequired: {
    heading: "Accreditation required",
    explanation:
      "This feature is limited to accredited investors, and your wallet is not accredited yet.",
    chipLabel: "Accreditation Required",
    guidance:
      "Submit an accreditation application with supporting documents. Once it is approved, retry.",
    cta: { label: "Apply for Accreditation", href: ACCREDITATION_ROUTE },
  },
  SignerOnly: {
    heading: "Signers only",
    explanation:
      "Only wallets in the governance signer set can use this area. Connect a signer wallet to continue.",
    chipLabel: "Signer Only",
    guidance: "Connect a wallet that is in the governance signer set.",
    cta: null,
  },
};
