"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { MaturityReminderSettings } from "@/components/settings/MaturityReminderSettings";
import { useAlertPreferences } from "@/hooks/useAlertPreferences";
import {
  ALERT_EVENTS,
  DEFAULT_ALERT_PREFERENCES,
  type MaturityReminderInterval,
} from "@/lib/alertPreferences";
import type { AlertPreferences } from "@/lib/api";

/**
 * Per-event alert toggles and maturity reminder intervals (#542) with a single
 * save that submits `set_alert_preferences` (#531).
 */
export function AlertPreferencesSettings() {
  const { preferences, maturityReminderDays, isLoading, isError, isConnected, save } =
    useAlertPreferences();
  const [draft, setDraft] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES);
  const [draftReminderDays, setDraftReminderDays] =
    useState<MaturityReminderInterval[]>(maturityReminderDays);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  useEffect(() => {
    setDraftReminderDays(maturityReminderDays);
  }, [maturityReminderDays]);

  if (!isConnected) {
    return (
      <Card data-testid="alert-preferences-connect">
        <CardHeader>
          <CardTitle className="text-base">Alert preferences</CardTitle>
          <CardDescription>Connect your wallet to manage your alerts.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="alert-preferences">
      <CardHeader>
        <CardTitle className="text-base">Alert preferences</CardTitle>
        <CardDescription>Choose which platform events you want to be alerted about.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4" data-testid="alert-preferences-loading" aria-busy="true">
            {ALERT_EVENTS.map(({ key }) => (
              <Skeleton key={key} className="h-9 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground" data-testid="alert-preferences-error">
            Couldn&apos;t load your alert preferences.
          </p>
        ) : (
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate({ ...draft, maturity_reminder_days: draftReminderDays });
            }}
          >
            <div className="divide-y">
              {ALERT_EVENTS.map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <Label htmlFor={`alert-${key}`} className="text-sm font-medium">
                      {label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    id={`alert-${key}`}
                    checked={draft[key]}
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({ ...current, [key]: checked }))
                    }
                    data-testid={`alert-toggle-${key}`}
                  />
                </div>
              ))}
            </div>
            <MaturityReminderSettings days={draftReminderDays} onChange={setDraftReminderDays} />
            <Button type="submit" disabled={save.isPending} data-testid="alert-preferences-save">
              {save.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Save preferences
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
