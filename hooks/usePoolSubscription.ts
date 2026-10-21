"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelPoolSubscription,
  createPoolSubscription,
  fetchPoolSubscription,
  type CreatePoolSubscriptionInput,
} from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

export function poolSubscriptionQueryKey(poolId: string, address: string | null) {
  return ["pool-subscription", poolId, address] as const;
}

/**
 * The connected wallet's subscription to one pool (#544). Creating and
 * cancelling submit `create_subscription` and `cancel_subscription`.
 */
export function usePoolSubscription(poolId: string) {
  const { address, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const key = poolSubscriptionQueryKey(poolId, address);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchPoolSubscription(poolId, address as string),
    enabled: isConnected && Boolean(address) && Boolean(poolId),
    staleTime: 30 * 1000,
  });

  const create = useMutation({
    mutationFn: (input: CreatePoolSubscriptionInput) => {
      if (!address) throw new Error("Connect a wallet to subscribe");
      return createPoolSubscription(poolId, input, address);
    },
    onSuccess: () => {
      toast.success("Subscription started");
    },
    onError: () => {
      toast.error("Couldn't start your subscription. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const cancel = useMutation({
    mutationFn: () => {
      if (!address) throw new Error("Connect a wallet to cancel");
      return cancelPoolSubscription(poolId, address);
    },
    onSuccess: () => {
      toast.success("Subscription cancelled");
    },
    onError: () => {
      toast.error("Couldn't cancel your subscription. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    subscription: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isConnected,
    create,
    cancel,
  };
}
