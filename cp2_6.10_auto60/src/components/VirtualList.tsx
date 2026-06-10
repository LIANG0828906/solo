import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
}

function VirtualList<T>({ items, itemHeight, containerHeight, renderItem }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
      offsetY: (startIndex + idx) * itemHeight
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    setScrollTop(0);
  }, [items]);

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, offsetY }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetY,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualList;
