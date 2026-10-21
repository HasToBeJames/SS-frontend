"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  disableRollover,
  fetchRolloverConfig,
  fetchRolloverExecutedEvents,
  setRolloverConfig,
  type RolloverExecutedEvent,
} from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import {
  toRolloverConfig,
  toRolloverConfigPayload,
  type RolloverConfig,
  type RolloverConfigInput,
} from "@/lib/rollover";

/**
 * Auto-rollover settings state (#545).
 *
 * Reads the saved config and the `RolloverExecuted` event log for the connected
 * wallet, and exposes the two contract writes: `set_rollover_config` on save
 * and `disable_rollover` behind a confirmation in the UI.
 */

export function rolloverConfigQueryKey(address: string | null) {
  return ["rollover", "config", address] as const;
}

export function rolloverEventsQueryKey(address: string | null) {
  return ["rollover", "events", address] as const;
}

export function useRollover() {
  const { address, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const configKey = rolloverConfigQueryKey(address);

  const configQuery = useQuery({
    queryKey: configKey,
    queryFn: () => fetchRolloverConfig(address as string),
    enabled: isConnected && Boolean(address),
    staleTime: 30 * 1000,
  });

  const eventsQuery = useQuery({
    queryKey: rolloverEventsQueryKey(address),
    queryFn: () => fetchRolloverExecutedEvents(address as string),
    enabled: isConnected && Boolean(address),
    staleTime: 30 * 1000,
  });

  const config: RolloverConfig | null = useMemo(
    () => (configQuery.data?.config ? toRolloverConfig(configQuery.data.config) : null),
    [configQuery.data],
  );

  const events: RolloverExecutedEvent[] = useMemo(
    () => eventsQuery.data ?? [],
    [eventsQuery.data],
  );

  const save = useMutation({
    mutationFn: (input: RolloverConfigInput) => {
      if (!address) throw new Error("Connect a wallet to configure rollover");
      return setRolloverConfig(address, toRolloverConfigPayload(input, true));
    },
    onSuccess: () => {
      toast.success("Rollover settings saved");
    },
    onError: () => {
      toast.error("Couldn't save your rollover settings. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: configKey });
    },
  });

  const disable = useMutation({
    mutationFn: () => {
      if (!address) throw new Error("Connect a wallet to configure rollover");
      return disableRollover(address);
    },
    onSuccess: () => {
      toast.success("Auto-rollover disabled");
    },
    onError: () => {
      toast.error("Couldn't disable auto-rollover. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: configKey });
    },
  });

  return {
    config,
    events,
    isLoading: configQuery.isLoading || eventsQuery.isLoading,
    isError: configQuery.isError,
    isConnected,
    save,
    disable,
  };
}
