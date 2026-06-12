import { useState, useRef, useCallback, useEffect } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  overscan?: number;
  totalItems: number;
}

interface VirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement>;
  visibleItems: { index: number; offsetY: number }[];
  totalHeight: number;
  scrollTop: number;
}

export function useVirtualScroll({
  itemHeight,
  overscan = 3,
  totalItems
}: VirtualScrollOptions): VirtualScrollResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleItems, setVisibleItems] = useState<{ index: number; offsetY: number }[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);

  const calculateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const height = container.clientHeight;
    const currentScrollTop = container.scrollTop;
    
    const startIndex = Math.max(0, Math.floor(currentScrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems,
      Math.ceil((currentScrollTop + height) / itemHeight) + overscan
    );
    
    const items: { index: number; offsetY: number }[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push({ index: i, offsetY: i * itemHeight });
    }
    
    setVisibleItems(items);
    setScrollTop(currentScrollTop);
  }, [itemHeight, overscan, totalItems]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      requestAnimationFrame(calculateVisibleItems);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
      calculateVisibleItems();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    
    setContainerHeight(container.clientHeight);
    calculateVisibleItems();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateVisibleItems]);

  useEffect(() => {
    calculateVisibleItems();
  }, [totalItems, calculateVisibleItems]);

  return {
    containerRef,
    visibleItems,
    totalHeight: totalItems * itemHeight,
    scrollTop
  };
}
