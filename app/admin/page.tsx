"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminInvoiceReview } from "@/components/admin/AdminInvoiceReview";
import { AdminSettlements } from "@/components/admin/AdminSettlements";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { TimelockProposalsPanel } from "@/components/admin/TimelockProposalsPanel";
import { TradingControlsPanel } from "@/components/admin/TradingControlsPanel";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "invoices" | "settlements" | "audit-log" | "timelock" | "trading-controls"
  >("invoices");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex justify-end">
        {/* #440 — platform fee configuration */}
        <Link href="/admin/fee-config" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
          Fee configuration →
        </Link>
        <Link href="/admin/contracts" className="ml-4 text-sm text-muted-foreground hover:text-foreground hover:underline">
          Contract registry →
        </Link>
      </div>
      <div className="mb-6 flex gap-4 border-b">
        <button
          type="button"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "invoices"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices
        </button>
        <button
          type="button"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "settlements"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("settlements")}
          data-testid="settlements-tab"
        >
          Settlements
        </button>
        <button
          type="button"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "audit-log"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("audit-log")}
          data-testid="audit-log-tab"
        >
          Audit Log
        </button>
        <button
          type="button"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "timelock"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("timelock")}
          data-testid="timelock-tab"
        >
          Timelock
        </button>
        <button
          type="button"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "trading-controls"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("trading-controls")}
          data-testid="trading-controls-tab"
        >
          Trading Controls
        </button>
      </div>

      {activeTab === "invoices" && <AdminInvoiceReview />}
      {activeTab === "settlements" && <AdminSettlements />}
      {activeTab === "audit-log" && <AuditLogViewer />}
      {activeTab === "timelock" && <TimelockProposalsPanel />}
      {activeTab === "trading-controls" && <TradingControlsPanel />}
    </div>
  );
}
