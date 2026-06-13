import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualListResult<T> {
  virtualItems: { item: T; index: number; offset: number }[];
  totalHeight: number;
  startOffset: number;
  onScroll: (scrollTop: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: VirtualListOptions<T>): VirtualListResult<T> {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const onScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      onScroll(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  const totalHeight = items.length * itemHeight;

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const result: { item: T; index: number; offset: number }[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      result.push({
        item: items[i],
        index: i,
        offset: i * itemHeight,
      });
    }
    return result;
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const startOffset = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan) * itemHeight;

  return {
    virtualItems,
    totalHeight,
    startOffset,
    onScroll,
    scrollContainerRef,
  };
}

export default useVirtualList;
