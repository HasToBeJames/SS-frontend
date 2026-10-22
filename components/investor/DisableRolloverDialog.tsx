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

interface DisableRolloverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * Confirmation before `disable_rollover` is submitted (#545). Matured positions
 * will no longer be reinvested until the investor turns rollover back on.
 */
export function DisableRolloverDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: DisableRolloverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="disable-rollover-dialog">
        <DialogHeader>
          <DialogTitle>Disable auto-rollover?</DialogTitle>
          <DialogDescription>
            Matured positions will stop being reinvested automatically. Your saved
            criteria are kept, so you can re-enable rollover at any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Keep it on
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="confirm-disable-rollover"
          >
            {isPending ? "Disabling…" : "Disable auto-rollover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
