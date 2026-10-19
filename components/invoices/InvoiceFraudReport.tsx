"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/context/WalletContext";
import { fetchInvoiceReportStatus, submitInvoiceReport, type InvoiceReportReason } from "@/lib/api";

const REASONS: { value: InvoiceReportReason; label: string }[] = [
  { value: "misrepresentation", label: "Misrepresentation" },
  { value: "false_documents", label: "False Documents" },
  { value: "non_delivery", label: "Non-Delivery" },
  { value: "other", label: "Other" },
];

export const invoiceReportStatusQueryKey = (invoiceId: string, wallet?: string | null) =>
  ["invoice", invoiceId, "report-status", wallet] as const;

async function evidenceHash(evidence: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(evidence.trim()));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function InvoiceUnderReviewBanner({ invoiceId }: { invoiceId: string }) {
  const { data } = useQuery({
    queryKey: invoiceReportStatusQueryKey(invoiceId),
    queryFn: () => fetchInvoiceReportStatus(invoiceId),
  });
  if (!data?.active_reports) return null;

  return (
    <div role="status" data-testid="invoice-under-review" className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <strong>Under Review.</strong> This invoice has an active investor report and is being reviewed.
    </div>
  );
}

export function InvoiceFraudReport({ invoiceId, isInvestor }: { invoiceId: string; isInvestor: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<InvoiceReportReason | "">("");
  const [evidence, setEvidence] = useState("");
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: invoiceReportStatusQueryKey(invoiceId, address),
    queryFn: () => fetchInvoiceReportStatus(invoiceId, address),
    enabled: isInvestor && Boolean(address),
  });
  const submit = useMutation({
    mutationFn: async () => {
      if (!address || !reason) throw new Error("Select a report reason");
      return submitInvoiceReport(invoiceId, {
        reason,
        evidence_hash: await evidenceHash(evidence),
        wallet: address,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId, "report-status"] });
      setOpen(false);
      setReason("");
      setEvidence("");
      toast.success("Report submitted for review");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to submit report"),
  });

  if (!isInvestor || !address) return null;
  if (status.data?.reported_by_wallet) {
    return <Button variant="outline" size="sm" disabled data-testid="report-submitted"><CheckCircle2 className="mr-2 h-4 w-4" /> Report Submitted</Button>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive" data-testid="report-invoice"><AlertTriangle className="mr-2 h-4 w-4" /> Report Invoice</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report invoice</DialogTitle>
          <DialogDescription>Your report is confidential and will be reviewed by the platform team.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            Reason
            <select className="w-full rounded-md border bg-background px-3 py-2" value={reason} onChange={(event) => setReason(event.target.value as InvoiceReportReason)} data-testid="report-reason">
              <option value="">Select a reason</option>
              {REASONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Evidence description <span className="font-normal text-muted-foreground">(optional)</span>
            <Textarea value={evidence} maxLength={500} onChange={(event) => setEvidence(event.target.value)} data-testid="report-evidence" />
            <span className="block text-right text-xs text-muted-foreground">{evidence.length}/500</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => submit.mutate()} disabled={!reason || submit.isPending}>
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
