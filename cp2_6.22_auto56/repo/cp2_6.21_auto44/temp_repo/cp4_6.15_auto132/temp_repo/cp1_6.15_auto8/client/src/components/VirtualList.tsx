import { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/VirtualList.css';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  bufferSize?: number;
}

function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  bufferSize = 3,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex, offsetY, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferSize * 2;
    const end = Math.min(items.length, start + visibleCount);
    const offset = start * itemHeight;
    const visible = items.slice(start, end);
    return {
      startIndex: start,
      endIndex: end,
      offsetY: offset,
      visibleItems: visible,
    };
  }, [scrollTop, items, itemHeight, containerHeight, bufferSize]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    setScrollTop(0);
  }, [items]);

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{ height: containerHeight, overflowY: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => {
            const realIndex = startIndex + i;
            return renderItem(item, realIndex, {
              height: itemHeight,
              boxSizing: 'border-box',
            });
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
