import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  loadMore: () => Promise<void> | void;
  hasMore: boolean;
  threshold?: number;
  root?: Element | null;
}

interface UseInfiniteScrollReturn {
  sentinelRef: (element: Element | null) => void;
}

export function useInfiniteScroll({
  loadMore,
  hasMore,
  threshold = 200,
  root = null,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const sentinelRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isLoadingRef = useRef(false);
  const loadMoreRef = useRef(loadMore);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const handleObserver = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (!entry.isIntersecting || !hasMoreRef.current || isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;
      try {
        await loadMoreRef.current();
      } finally {
        isLoadingRef.current = false;
      }
    },
    []
  );

  const setSentinelRef = useCallback((element: Element | null) => {
    if (observerRef.current && sentinelRef.current) {
      observerRef.current.unobserve(sentinelRef.current);
    }
    sentinelRef.current = element;
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    });

    observerRef.current = observer;

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [threshold, root, handleObserver]);

  return { sentinelRef: setSentinelRef };
}
