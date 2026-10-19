"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiForbiddenError, fetchContractRegistry } from "@/lib/api";
import { truncateAddress } from "@/lib/stellar";

export function ContractRegistryStatus({ token }: { token: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "contracts"],
    queryFn: () => fetchContractRegistry(token),
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-72 w-full" data-testid="contract-registry-loading" />;
  if (error instanceof ApiForbiddenError) {
    return <p role="alert" className="rounded-md border border-destructive/50 p-4 text-destructive">Access denied. This wallet is not an admin.</p>;
  }
  if (error || !data) return <p role="alert" className="text-destructive">Could not load contract registry status.</p>;

  const upgrades = [...data.recent_upgrades].sort(
    (a, b) => new Date(b.upgraded_at).getTime() - new Date(a.upgraded_at).getTime(),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Registered contracts</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm" data-testid="contract-registry-table">
            <thead className="border-b text-muted-foreground"><tr><th className="p-3">Contract</th><th className="p-3">Version</th><th className="p-3">Address</th><th className="p-3">Last upgraded</th><th className="p-3">Compatibility</th></tr></thead>
            <tbody className="divide-y">
              {data.contracts.map((contract) => (
                <tr key={contract.address}>
                  <td className="p-3 font-medium">{contract.name}</td>
                  <td className="p-3 font-mono">{contract.current_version}</td>
                  <td className="p-3 font-mono" title={contract.address}>{truncateAddress(contract.address)}</td>
                  <td className="p-3">{new Date(contract.last_upgraded_at).toLocaleString()}</td>
                  <td className="p-3"><Badge variant={contract.compatibility_status === "current" ? "default" : "destructive"} className="capitalize">{contract.compatibility_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent upgrades</CardTitle></CardHeader>
        <CardContent>
          {upgrades.length === 0 ? <p className="text-sm text-muted-foreground">No upgrades recorded.</p> : (
            <ol className="space-y-4" data-testid="upgrade-timeline">
              {upgrades.map((upgrade) => (
                <li key={upgrade.id} className="border-l-2 pl-4">
                  <p className="font-medium">{upgrade.contract_name}</p>
                  <p className="text-sm">{upgrade.from_version} → {upgrade.to_version}</p>
                  <time className="text-xs text-muted-foreground" dateTime={upgrade.upgraded_at}>{new Date(upgrade.upgraded_at).toLocaleString()}</time>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
