import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialLoad?: number;
  loadMore?: number;
  totalItems: number;
}

export function useInfiniteScroll({
  threshold = 200,
  initialLoad = 12,
  loadMore = 8,
  totalItems,
}: UseInfiniteScrollOptions) {
  const [visibleCount, setVisibleCount] = useState(initialLoad);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreItems = useCallback(() => {
    if (isLoading || visibleCount >= totalItems) return;
    
    setIsLoading(true);
    requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + loadMore, totalItems));
      setIsLoading(false);
    });
  }, [isLoading, visibleCount, totalItems, loadMore]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMoreItems();
          }
        });
      },
      {
        rootMargin: `${threshold}px 0px`,
        threshold: 0.1,
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreItems, threshold]);

  useEffect(() => {
    setVisibleCount(initialLoad);
  }, [totalItems, initialLoad]);

  return {
    visibleCount,
    sentinelRef,
    isLoading,
    hasMore: visibleCount < totalItems,
  };
}
