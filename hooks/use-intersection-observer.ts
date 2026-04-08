'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useIntersectionObserver(
  onIntersect: () => void,
  options?: { enabled?: boolean; rootMargin?: string },
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const enabled = options?.enabled ?? true;

  const stableOnIntersect = useCallback(onIntersect, [onIntersect]);

  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) stableOnIntersect();
      },
      { rootMargin: options?.rootMargin ?? '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [enabled, stableOnIntersect, options?.rootMargin]);

  return sentinelRef;
}
