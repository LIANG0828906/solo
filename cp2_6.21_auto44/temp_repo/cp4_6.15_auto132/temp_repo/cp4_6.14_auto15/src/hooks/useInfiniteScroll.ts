import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  callback: () => void;
  hasMore: boolean;
  loading: boolean;
  rootMargin?: string;
  threshold?: number;
}

export function useInfiniteScroll({
  callback,
  hasMore,
  loading,
  rootMargin = '100px',
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          callback();
        }
      },
      { rootMargin, threshold }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [callback, hasMore, loading, rootMargin, threshold]);

  return observerRef;
}
