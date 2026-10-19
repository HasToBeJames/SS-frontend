"use client";

import { SnapshotHistoryPage } from "@/components/dashboard/SnapshotHistoryPage";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function InvestorSnapshotsPage() {
  usePageTitle("Snapshot Distributions");

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Snapshot Distributions</h1>
      <SnapshotHistoryPage />
    </main>
  );
}
