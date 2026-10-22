"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DisableAutoInvestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * Confirmation before the `disable_auto_invest` kill switch is pulled (#476).
 *
 * Disabling stops future automatic buys, so it is deliberately a two-step
 * action rather than a bare switch.
 */
export function DisableAutoInvestDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: DisableAutoInvestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="disable-auto-invest-dialog">
        <DialogHeader>
          <DialogTitle>Disable auto-invest?</DialogTitle>
          <DialogDescription>
            The protocol will stop investing on your behalf until you turn it
            back on. Your saved rule is kept, so you can re-enable it at any
            time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Keep it on
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="confirm-disable-auto-invest"
          >
            {isPending ? "Disabling…" : "Disable auto-invest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
