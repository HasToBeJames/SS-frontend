"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Save, Settings2 } from "lucide-react";
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
import { useAutoInvest } from "@/hooks/useAutoInvest";
import {
  AUTO_INVEST_SECTORS,
  AUTO_INVEST_SECTOR_LABELS,
  ruleToDraft,
  validateAutoInvestRule,
  type AutoInvestRuleDraft,
  type AutoInvestSector,
} from "@/lib/autoInvest";
import { cn } from "@/lib/utils";
import { AutoInvestActivityList } from "./AutoInvestActivityList";
import { AutoInvestRuleSummary } from "./AutoInvestRuleSummary";
import { DisableAutoInvestDialog } from "./DisableAutoInvestDialog";

interface AutoInvestSettingsPanelProps {
  className?: string;
}

/**
 * Auto-invest configuration panel (#476).
 *
 * Configure the sector(s), minimum yield, maximum invoice age and per-invoice
 * cap; save submits `set_auto_invest_rule`. The top toggle enables/disables,
 * with a confirmation step before `disable_auto_invest`. Recent
 * `AutoInvestExecuted` events are listed underneath.
 */
export function AutoInvestSettingsPanel({
  className,
}: AutoInvestSettingsPanelProps) {
  const { rule, events, isLoading, isError, isConnected, save, disable } =
    useAutoInvest();

  const [draft, setDraft] = useState<AutoInvestRuleDraft>(() =>
    ruleToDraft(null),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const validation = validateAutoInvestRule(draft);
  const enabled = rule?.isEnabled ?? false;

  // Mirror the fetched rule into the form while the user is not editing it;
  // once the editor is open their in-progress draft wins.
  useEffect(() => {
    if (!formOpen) {
      setDraft(ruleToDraft(rule));
    }
  }, [rule, formOpen]);

  const openEditor = () => {
    setDraft(ruleToDraft(rule));
    setSubmitted(false);
    setFormOpen(true);
  };

  const handleToggle = (next: boolean) => {
    if (next) {
      if (rule) {
        // Re-enable the saved rule unchanged.
        save.mutate(rule);
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
    if (!validation.valid || !validation.rule) return;
    save.mutate(validation.rule, {
      onSuccess: () => {
        setFormOpen(false);
        setSubmitted(false);
      },
    });
  };

  const toggleSector = (sector: AutoInvestSector) => {
    setDraft((current) => ({
      ...current,
      sectors: current.sectors.includes(sector)
        ? current.sectors.filter((value) => value !== sector)
        : [...current.sectors, sector],
    }));
  };

  const updateField = (
    field: Exclude<keyof AutoInvestRuleDraft, "sectors">,
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  if (!isConnected) {
    return (
      <Card className={className} data-testid="auto-invest-connect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Auto-invest
          </CardTitle>
          <CardDescription>
            Connect your wallet to configure automatic investing.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="auto-invest-settings-panel">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Auto-invest
            </CardTitle>
            <CardDescription>
              Automatically invest in invoices that match your rule.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-invest-toggle" className="text-sm">
              {enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="auto-invest-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isLoading || save.isPending || disable.isPending}
              aria-label="Enable auto-invest"
              data-testid="auto-invest-toggle"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3" data-testid="auto-invest-loading">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground" data-testid="auto-invest-error">
            Couldn&apos;t load your auto-invest settings.
          </p>
        ) : (
          <>
            {rule && !formOpen && (
              <div className="space-y-3">
                <AutoInvestRuleSummary rule={rule} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditor}
                  data-testid="auto-invest-edit"
                >
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Edit rule
                </Button>
              </div>
            )}

            {(!rule || formOpen) && (
              <form
                className="space-y-5"
                data-testid="auto-invest-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSave();
                }}
              >
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Sectors</legend>
                  <p className="text-xs text-muted-foreground">
                    Invoices in any of the selected sectors are eligible.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AUTO_INVEST_SECTORS.map((sector) => {
                      const selected = draft.sectors.includes(sector);
                      return (
                        <button
                          key={sector}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleSector(sector)}
                          data-testid={`sector-chip-${sector}`}
                          className={cn(
                            "rounded-full border px-3 py-1 text-sm transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background hover:bg-accent",
                          )}
                        >
                          {AUTO_INVEST_SECTOR_LABELS[sector]}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && validation.errors.sectors && (
                    <p
                      role="alert"
                      className="text-xs text-destructive"
                      data-testid="sectors-error"
                    >
                      {validation.errors.sectors}
                    </p>
                  )}
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="auto-invest-min-yield">Minimum yield (%)</Label>
                    <Input
                      id="auto-invest-min-yield"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={0.1}
                      value={draft.minYield}
                      onChange={(event) =>
                        updateField("minYield", event.target.value)
                      }
                      data-testid="auto-invest-min-yield"
                    />
                    {submitted && validation.errors.minYield && (
                      <p role="alert" className="text-xs text-destructive">
                        {validation.errors.minYield}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto-invest-max-age">
                      Max invoice age (days)
                    </Label>
                    <Input
                      id="auto-invest-max-age"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={draft.maxInvoiceAgeDays}
                      onChange={(event) =>
                        updateField("maxInvoiceAgeDays", event.target.value)
                      }
                      data-testid="auto-invest-max-age"
                    />
                    {submitted && validation.errors.maxInvoiceAgeDays && (
                      <p role="alert" className="text-xs text-destructive">
                        {validation.errors.maxInvoiceAgeDays}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto-invest-max-amount">
                      Max amount per invoice (XLM)
                    </Label>
                    <Input
                      id="auto-invest-max-amount"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={draft.maxAmountPerInvoice}
                      onChange={(event) =>
                        updateField("maxAmountPerInvoice", event.target.value)
                      }
                      data-testid="auto-invest-max-amount"
                    />
                    {submitted && validation.errors.maxAmountPerInvoice && (
                      <p role="alert" className="text-xs text-destructive">
                        {validation.errors.maxAmountPerInvoice}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={save.isPending}
                    data-testid="auto-invest-save"
                  >
                    {save.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    Save rule
                  </Button>
                  {rule && (
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

            <AutoInvestActivityList events={events} />
          </>
        )}
      </CardContent>

      <DisableAutoInvestDialog
        open={confirmDisable}
        onOpenChange={setConfirmDisable}
        onConfirm={handleConfirmDisable}
        isPending={disable.isPending}
      />
    </Card>
  );
}
