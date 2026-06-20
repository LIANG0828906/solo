import React, { useRef, useState, useCallback } from 'react';

interface WindowedListProps {
  items: any[];
  itemHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  gap?: number;
}

const WindowedList: React.FC<WindowedListProps> = ({
  items,
  itemHeight,
  renderItem,
  className,
  gap = 0,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  const containerHeight = scrollRef.current?.clientHeight ?? 0;
  const rowSize = itemHeight + gap;
  const totalHeight = items.length * rowSize;

  const startIndex = Math.max(0, Math.floor(scrollTop / rowSize) - 2);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / rowSize) + 2,
  );

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(
      <div
        key={i}
        style={{ position: 'absolute', top: i * rowSize, height: itemHeight, left: 0, right: 0 }}
      >
        {renderItem(items[i], i)}
      </div>,
    );
  }

  return (
    <div
      ref={scrollRef}
      className={className}
      style={{ position: 'relative', overflowY: 'auto', flex: 1 }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
};

export default WindowedList;
