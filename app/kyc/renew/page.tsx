"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KycDocumentStatusDashboard } from "@/components/kyc/KycDocumentStatusDashboard";

export default function KycRenewPage() {
  return <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8"><div><h1 className="text-2xl font-bold">Renew investor accreditation</h1><p className="mt-1 text-sm text-muted-foreground">Replace rejected or expired evidence. Each document returns to Under Review after submission.</p></div><KycDocumentStatusDashboard /><Button asChild variant="outline"><Link href="/kyc/status">Back to verification status</Link></Button></main>;
}
