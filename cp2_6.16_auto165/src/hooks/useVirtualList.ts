import { useState, useEffect, useMemo, useCallback, RefObject } from 'react';

interface VirtualListOptions<T> {
  containerRef: RefObject<HTMLElement>;
  itemHeight: number;
  overscan?: number;
}

interface VirtualListResult<T> {
  visibleItems: T[];
  totalHeight: number;
  getStartOffset: (index: number) => number;
}

export function useVirtualList<T>(
  items: T[],
  options: VirtualListOptions<T>
): VirtualListResult<T> {
  const { containerRef, itemHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    setContainerHeight(container.clientHeight);
    setScrollTop(container.scrollTop);

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      setContainerHeight(container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  const totalHeight = useMemo(() => {
    return items.length * itemHeight;
  }, [items.length, itemHeight]);

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const end = Math.min(items.length, start + visibleCount);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const getStartOffset = useCallback(
    (index: number): number => {
      return (startIndex + index) * itemHeight;
    },
    [startIndex, itemHeight]
  );

  return { visibleItems, totalHeight, getStartOffset };
}
