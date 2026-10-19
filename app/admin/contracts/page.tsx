"use client";

import { ShieldAlert } from "lucide-react";
import { ContractRegistryStatus } from "@/components/admin/ContractRegistryStatus";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { hasAdminRole } from "@/lib/adminAuth";

export default function ContractRegistryPage() {
  const { jwt, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!hasAdminRole(jwt)) {
    return (
      <main className="container mx-auto flex justify-center px-4 py-16">
        <Card className="w-full max-w-md" data-testid="contract-registry-denied">
          <CardContent className="flex flex-col items-center space-y-3 pt-6 text-center">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <h1 className="text-xl font-bold">Access Denied</h1>
            <p className="text-sm text-muted-foreground">Connect an admin wallet to view platform contract status.</p>
          </CardContent>
        </Card>
      </main>
    );
  }
  return <main className="container mx-auto max-w-6xl space-y-6 px-4 py-8"><div><h1 className="text-2xl font-bold">Contract registry</h1><p className="text-sm text-muted-foreground">Live deployment versions, compatibility, and upgrade history.</p></div><ContractRegistryStatus token={jwt!} /></main>;
}
