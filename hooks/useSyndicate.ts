"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchInvoiceSyndicate,
  submitSyndicateCall,
  type SyndicateContractMethod,
} from "@/lib/api";

export const syndicateQueryKey = (invoiceId: string) =>
  ["invoice", invoiceId, "syndicate"] as const;

export function useInvoiceSyndicate(invoiceId: string) {
  return useQuery({
    queryKey: syndicateQueryKey(invoiceId),
    queryFn: () => fetchInvoiceSyndicate(invoiceId),
    enabled: Boolean(invoiceId),
  });
}

const SUCCESS_MESSAGES: Record<SyndicateContractMethod, string> = {
  create_syndicate: "Syndicate created",
  join_syndicate: "Joined syndicate",
  exit_syndicate: "Exited syndicate",
  execute_syndicate: "Syndicate executed",
};

const ERROR_MESSAGES: Record<SyndicateContractMethod, string> = {
  create_syndicate: "Could not create syndicate",
  join_syndicate: "Could not join syndicate",
  exit_syndicate: "Could not exit syndicate",
  execute_syndicate: "Could not execute syndicate",
};

interface SyndicateVars {
  method: SyndicateContractMethod;
  wallet: string;
  min_co_invest?: number;
  amount?: number;
}

export function useSyndicateMutation(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ method, wallet, ...args }: SyndicateVars) =>
      submitSyndicateCall(invoiceId, method, wallet, args),
    onSuccess: (_data, { method }) => {
      toast.success(SUCCESS_MESSAGES[method]);
      queryClient.invalidateQueries({ queryKey: syndicateQueryKey(invoiceId) });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
    onError: (_err, { method }) => {
      toast.error(ERROR_MESSAGES[method]);
    },
  });
}
