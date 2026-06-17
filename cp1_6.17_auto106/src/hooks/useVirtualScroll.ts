import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  gap?: number;
  overscan?: number;
}

export function useVirtualScroll<T>(items: T[], options: UseVirtualScrollOptions) {
  const { itemHeight, gap = 16, overscan = 3 } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const rowHeight = itemHeight + gap;
  const totalHeight = items.length * rowHeight - gap;

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
    item,
    index: startIndex + index,
    offsetY: startIndex * rowHeight + index * rowHeight
  }));

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  return {
    containerRef,
    handleScroll,
    visibleItems,
    totalHeight,
    startIndex,
    endIndex
  };
}
