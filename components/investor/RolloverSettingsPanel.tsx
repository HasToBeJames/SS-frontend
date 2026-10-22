"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AUTO_INVEST_SECTORS, AUTO_INVEST_SECTOR_LABELS } from "@/lib/autoInvest";
import { useRollover } from "@/hooks/useRollover";
import {
  rolloverToDraft,
  validateRolloverConfig,
  type RolloverDraft,
} from "@/lib/rollover";
import { RolloverActivityList } from "./RolloverActivityList";
import { RolloverSummaryCard } from "./RolloverSummaryCard";
import { DisableRolloverDialog } from "./DisableRolloverDialog";

interface RolloverSettingsPanelProps {
  className?: string;
}

/**
 * Auto-rollover configuration panel (#545).
 *
 * Configure the sector, minimum yield, maximum invoice age and maximum amount
 * that a matured position is reinvested into. Save submits
 * `set_rollover_config`; the toggle disables with `disable_rollover` after a
 * confirmation. `RolloverExecuted` events are listed underneath.
 */
export function RolloverSettingsPanel({ className }: RolloverSettingsPanelProps) {
  const { config, events, isLoading, isError, isConnected, save, disable } = useRollover();

  const [draft, setDraft] = useState<RolloverDraft>(() => rolloverToDraft(null));
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const validation = validateRolloverConfig(draft);
  const enabled = config?.isEnabled ?? false;

  // Mirror the saved config into the form while the user is not editing it.
  useEffect(() => {
    if (!formOpen) {
      setDraft(rolloverToDraft(config));
    }
  }, [config, formOpen]);

  const openEditor = () => {
    setDraft(rolloverToDraft(config));
    setSubmitted(false);
    setFormOpen(true);
  };

  const handleToggle = (next: boolean) => {
    if (next) {
      if (config) {
        // Re-enable the saved config unchanged.
        save.mutate({
          sector: config.sector,
          minYield: config.minYield,
          maxInvoiceAgeDays: config.maxInvoiceAgeDays,
          maxAmount: config.maxAmount,
        });
      } else {
        openEditor();
      }
      return;
    }
    setConfirmDisable(true);
  };

  const handleConfirmDisable = () => {
    disable.mutate(undefined, {
      onSettled: () => setConfirmDisable(false),
    });
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!validation.valid || !validation.config) return;
    save.mutate(validation.config, {
      onSuccess: () => {
        setFormOpen(false);
        setSubmitted(false);
      },
    });
  };

  const updateField = (field: keyof RolloverDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  if (!isConnected) {
    return (
      <Card className={className} data-testid="rollover-connect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Auto-rollover
          </CardTitle>
          <CardDescription>
            Connect your wallet to configure automatic rollover at maturity.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="rollover-settings-panel">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Auto-rollover
            </CardTitle>
            <CardDescription>
              Reinvest matured positions into invoices that match your criteria.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="rollover-toggle" className="text-sm">
              {enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="rollover-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isLoading || save.isPending || disable.isPending}
              aria-label="Enable auto-rollover"
              data-testid="rollover-toggle"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3" data-testid="rollover-loading">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground" data-testid="rollover-error">
            Couldn&apos;t load your auto-rollover settings.
          </p>
        ) : (
          <>
            {config && !formOpen && (
              <div className="space-y-3">
                <RolloverSummaryCard config={config} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditor}
                  data-testid="rollover-edit"
                >
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Edit criteria
                </Button>
              </div>
            )}

            {(!config || formOpen) && (
              <form
                className="space-y-5"
                data-testid="rollover-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSave();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="rollover-sector">Sector</Label>
                  <select
                    id="rollover-sector"
                    value={draft.sector}
                    onChange={(event) => updateField("sector", event.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    data-testid="rollover-sector"
                  >
                    <option value="">Select a sector</option>
                    {AUTO_INVEST_SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {AUTO_INVEST_SECTOR_LABELS[sector]}
                      </option>
                    ))}
                  </select>
                  {submitted && validation.errors.sector && (
                    <p role="alert" className="text-xs text-destructive" data-testid="rollover-sector-error">
                      {validation.errors.sector}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="rollover-min-yield">Minimum yield (%)</Label>
                    <Input
                      id="rollover-min-yield"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={0.1}
                      value={draft.minYield}
                      onChange={(event) => updateField("minYield", event.target.value)}
                      data-testid="rollover-min-yield"
                    />
                    {submitted && validation.errors.minYield && (
                      <p role="alert" className="text-xs text-destructive">
                        {validation.errors.minYield}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rollover-max-age">Max invoice age (days)</Label>
                    <Input
                      id="rollover-max-age"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={draft.maxInvoiceAgeDays}
                      onChange={(event) => updateField("maxInvoiceAgeDays", event.target.value)}
                      data-testid="rollover-max-age"
                    />
                    {submitted && validation.errors.maxInvoiceAgeDays && (
                      <p role="alert" className="text-xs text-destructive">
                        {validation.errors.maxInvoiceAgeDays}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rollover-max-amount">Max amount (XLM)</Label>
                    <Input
                      id="rollover-max-amount"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={draft.maxAmount}
                      onChange={(event) => updateField("maxAmount", event.target.value)}
                      data-testid="rollover-max-amount"
                    />
                    {submitted && validation.errors.maxAmount && (
                      <p role="alert" className="text-xs text-destructive">
                        {validation.errors.maxAmount}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={save.isPending} data-testid="rollover-save">
                    {save.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    Save criteria
                  </Button>
                  {config && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormOpen(false)}
                      disabled={save.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}

            <RolloverActivityList events={events} />
          </>
        )}
      </CardContent>

      <DisableRolloverDialog
        open={confirmDisable}
        onOpenChange={setConfirmDisable}
        onConfirm={handleConfirmDisable}
        isPending={disable.isPending}
      />
    </Card>
  );
}
