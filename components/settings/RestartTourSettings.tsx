"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestOnboardingTourReplay } from "@/hooks/useOnboardingTour";

export function RestartTourSettings() {
  return (
    <Card data-testid="restart-tour-settings">
      <CardHeader>
        <CardTitle>Onboarding tour</CardTitle>
        <CardDescription>
          Walk through the marketplace, investing and the secondary market again from the start.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="outline"
          onClick={() => requestOnboardingTourReplay()}
          data-testid="restart-tour-button"
        >
          Restart tour
        </Button>
      </CardContent>
    </Card>
  );
}
