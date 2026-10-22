"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  disableAutoInvest,
  fetchAutoInvestExecutedEvents,
  fetchAutoInvestRule,
  setAutoInvestRule,
  type AutoInvestExecutedEvent,
  type AutoInvestRuleResponse,
} from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import {
  toAutoInvestRule,
  toAutoInvestRulePayload,
  type AutoInvestRule,
  type AutoInvestRuleInput,
} from "@/lib/autoInvest";

/**
 * Auto-invest settings state (#476).
 *
 * Reads the on-chain rule and the `AutoInvestExecuted` event log for the
 * connected wallet, and exposes the two contract writes with optimistic
 * updates: the toggle flips immediately and rolls back if the contract call
 * fails.
 */

export const AUTO_INVEST_RULE_QUERY_KEY = ["auto-invest", "rule"] as const;
export const AUTO_INVEST_EVENTS_QUERY_KEY = ["auto-invest", "events"] as const;

export function autoInvestRuleQueryKey(address: string | null) {
  return ["auto-invest", "rule", address] as const;
}

export function autoInvestEventsQueryKey(address: string | null) {
  return ["auto-invest", "events", address] as const;
}

export function useAutoInvest() {
  const { address, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const ruleKey = autoInvestRuleQueryKey(address);

  const ruleQuery = useQuery<AutoInvestRuleResponse>({
    queryKey: ruleKey,
    queryFn: () => fetchAutoInvestRule(address as string),
    enabled: isConnected && Boolean(address),
    staleTime: 30 * 1000,
  });

  const eventsQuery = useQuery<AutoInvestExecutedEvent[]>({
    queryKey: autoInvestEventsQueryKey(address),
    queryFn: () => fetchAutoInvestExecutedEvents(address as string),
    enabled: isConnected && Boolean(address),
    staleTime: 30 * 1000,
  });

  const rule: AutoInvestRule | null = useMemo(
    () =>
      ruleQuery.data?.rule ? toAutoInvestRule(ruleQuery.data.rule) : null,
    [ruleQuery.data],
  );

  const events = useMemo(
    () => eventsQuery.data ?? [],
    [eventsQuery.data],
  );

  /** `set_auto_invest_rule`: saves the rule (and enables it). */
  const saveMutation = useMutation({
    mutationFn: (input: AutoInvestRuleInput) => {
      if (!address) throw new Error("Connect a wallet to configure auto-invest");
      return setAutoInvestRule(address, toAutoInvestRulePayload(input, true));
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ruleKey });
      const previous = queryClient.getQueryData<AutoInvestRuleResponse>(ruleKey);
      queryClient.setQueryData<AutoInvestRuleResponse>(ruleKey, {
        address: address as string,
        rule: toAutoInvestRulePayload(input, true),
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ruleKey, context.previous);
      } else {
        queryClient.invalidateQueries({ queryKey: ruleKey });
      }
      toast.error("Couldn't save your auto-invest rule. Please try again.");
    },
    onSuccess: () => {
      toast.success("Auto-invest rule saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ruleKey });
    },
  });

  /** `disable_auto_invest`: the kill switch, confirmed in the UI first. */
  const disableMutation = useMutation({
    mutationFn: () => {
      if (!address) throw new Error("Connect a wallet to configure auto-invest");
      return disableAutoInvest(address);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ruleKey });
      const previous =
        queryClient.getQueryData<AutoInvestRuleResponse>(ruleKey) ?? null;
      queryClient.setQueryData<AutoInvestRuleResponse>(ruleKey, (old) =>
        old?.rule
          ? { ...old, rule: { ...old.rule, is_enabled: false } }
          : (old ?? { address: address as string, rule: null }),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ruleKey, context.previous);
      } else {
        queryClient.invalidateQueries({ queryKey: ruleKey });
      }
      toast.error("Couldn't disable auto-invest. Please try again.");
    },
    onSuccess: () => {
      toast.success("Auto-invest disabled");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ruleKey });
    },
  });

  return {
    rule,
    events,
    isLoading: ruleQuery.isLoading || eventsQuery.isLoading,
    isError: ruleQuery.isError,
    isConnected,
    save: saveMutation,
    disable: disableMutation,
  };
}
