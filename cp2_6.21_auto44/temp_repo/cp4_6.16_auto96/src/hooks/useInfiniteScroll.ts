import { RefObject, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  root?: RefObject<HTMLElement>;
  target: RefObject<HTMLElement>;
  onLoadMore: () => void;
  loading?: boolean;
  hasMore?: boolean;
  threshold?: number;
}

export function useInfiniteScroll({
  root,
  target,
  onLoadMore,
  loading = false,
  hasMore = true,
  threshold = 50,
}: UseInfiniteScrollOptions): void {
  const rafIdRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (loading || !hasMore || isProcessingRef.current) {
      return;
    }

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const targetEl = target.current;
      const rootEl = root?.current || null;

      if (!targetEl) {
        rafIdRef.current = null;
        return;
      }

      const scrollTop = rootEl ? rootEl.scrollTop : window.scrollY;
      const clientHeight = rootEl ? rootEl.clientHeight : window.innerHeight;
      const scrollHeight = rootEl ? rootEl.scrollHeight : document.documentElement.scrollHeight;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        isProcessingRef.current = true;
        onLoadMore();
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 100);
      }

      rafIdRef.current = null;
    });
  }, [target, root, onLoadMore, loading, hasMore, threshold]);

  useEffect(() => {
    const rootEl = root?.current;
    const scrollContainer = rootEl || window;

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll, root]);

  useEffect(() => {
    const targetEl = target.current;
    const rootEl = root?.current;

    if (!targetEl || loading || !hasMore) {
      return;
    }

    const clientHeight = rootEl ? rootEl.clientHeight : window.innerHeight;
    const scrollHeight = rootEl ? rootEl.scrollHeight : document.documentElement.scrollHeight;

    if (scrollHeight <= clientHeight) {
      handleScroll();
    }
  }, [target, root, handleScroll, loading, hasMore]);
}
