import { useRef, useEffect, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  callback: () => void;
  hasMore: boolean;
}

export function useInfiniteScroll({ callback, hasMore }: UseInfiniteScrollOptions) {
  const observer = useRef<IntersectionObserver | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore) {
        callback();
      }
    },
    [callback, hasMore]
  );

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '100px',
    });

    const element = ref.current;
    if (element) {
      observer.current.observe(element);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleIntersect]);

  return ref;
}
