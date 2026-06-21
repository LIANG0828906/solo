import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

interface VirtualListOptions<T> {
  items: T[];
  estimatedItemHeight: number;
  overscan?: number;
  getItemHeight?: (item: T, index: number) => number;
}

interface VirtualListResult<T> {
  visibleItems: Array<{ item: T; index: number; offset: number }>;
  totalHeight: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  setItemHeight: (index: number, height: number) => void;
}

export function useVirtualList<T>(options: VirtualListOptions<T>): VirtualListResult<T> {
  const {
    items,
    estimatedItemHeight,
    overscan = 5,
    getItemHeight,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemHeightsRef = useRef<Map<number, number>>(new Map());

  const itemOffsets = useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;

    for (let i = 0; i < items.length; i++) {
      offsets.push(offset);
      const cachedHeight = itemHeightsRef.current.get(i);
      if (cachedHeight !== undefined) {
        offset += cachedHeight;
      } else if (getItemHeight) {
        offset += getItemHeight(items[i], i);
      } else {
        offset += estimatedItemHeight;
      }
    }

    return offsets;
  }, [items, estimatedItemHeight, getItemHeight]);

  const totalHeight = useMemo(() => {
    if (items.length === 0) return 0;
    const lastOffset = itemOffsets[items.length - 1];
    const lastHeight = itemHeightsRef.current.get(items.length - 1) || estimatedItemHeight;
    return lastOffset + lastHeight;
  }, [itemOffsets, items.length, estimatedItemHeight]);

  const findStartIndex = useCallback(
    (scrollTop: number): number => {
      let low = 0;
      let high = items.length - 1;
      let result = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (itemOffsets[mid] <= scrollTop) {
          result = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      return Math.max(0, result);
    },
    [itemOffsets, items.length]
  );

  const findEndIndex = useCallback(
    (startIndex: number, viewportBottom: number): number => {
      let endIndex = startIndex;

      while (endIndex < items.length && itemOffsets[endIndex] < viewportBottom) {
        endIndex++;
      }

      return Math.min(items.length, endIndex + 1);
    },
    [itemOffsets, items.length]
  );

  const { startIndex, endIndex } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    const start = Math.max(0, findStartIndex(scrollTop) - overscan);
    const viewportBottom = scrollTop + containerHeight;
    const end = Math.min(items.length, findEndIndex(start, viewportBottom) + overscan);

    return { startIndex: start, endIndex: end };
  }, [scrollTop, containerHeight, items.length, findStartIndex, findEndIndex, overscan]);

  const visibleItems = useMemo(() => {
    const result: Array<{ item: T; index: number; offset: number }> = [];

    for (let i = startIndex; i < endIndex; i++) {
      result.push({
        item: items[i],
        index: i,
        offset: itemOffsets[i],
      });
    }

    return result;
  }, [items, startIndex, endIndex, itemOffsets]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'center') => {
      const container = containerRef.current;
      if (!container || index < 0 || index >= items.length) return;

      const itemOffset = itemOffsets[index];
      const itemHeight = itemHeightsRef.current.get(index) || estimatedItemHeight;

      let targetScrollTop: number;

      switch (align) {
        case 'start':
          targetScrollTop = itemOffset;
          break;
        case 'end':
          targetScrollTop = itemOffset + itemHeight - containerHeight;
          break;
        case 'center':
        default:
          targetScrollTop = itemOffset - containerHeight / 2 + itemHeight / 2;
          break;
      }

      targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight));
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    },
    [itemOffsets, estimatedItemHeight, containerHeight, totalHeight, items.length]
  );

  const setItemHeight = useCallback((index: number, height: number) => {
    itemHeightsRef.current.set(index, height);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return {
    visibleItems,
    totalHeight,
    onScroll,
    containerRef,
    scrollToIndex,
    setItemHeight,
  };
}
