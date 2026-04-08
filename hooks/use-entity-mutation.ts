'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface UseEntityMutationOptions {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  invalidateKeys: unknown[][];
  successMessage?: string;
  onSuccess?: () => void;
}

export function useEntityMutation<TInput = unknown>({
  method,
  endpoint,
  invalidateKeys,
  successMessage,
  onSuccess,
}: UseEntityMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: TInput) => {
      const res = await apiFetch(endpoint, {
        method,
        ...(input && method !== 'DELETE'
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            }
          : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Operation failed');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      if (successMessage) toast.success(successMessage);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
