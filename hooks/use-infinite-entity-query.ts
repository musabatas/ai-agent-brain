'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

interface UseInfiniteEntityQueryOptions {
  queryKey: unknown[];
  endpoint: string;
  params?: Record<string, string | undefined>;
  limit?: number;
  enabled?: boolean;
}

export function useInfiniteEntityQuery<T>({
  queryKey,
  endpoint,
  params = {},
  limit = 50,
  enabled = true,
}: UseInfiniteEntityQueryOptions) {
  return useInfiniteQuery<PaginatedResponse<T>>({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const sp = new URLSearchParams();
      sp.set('limit', String(limit));
      sp.set('offset', String(pageParam));
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'all') sp.set(k, v);
      });
      const res = await apiFetch(`${endpoint}?${sp.toString()}`);
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled,
  });
}
