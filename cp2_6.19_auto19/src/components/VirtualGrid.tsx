import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  gap?: number;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  gap = 16,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [columns, setColumns] = useState(3);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width < 600) {
          setColumns(1);
        } else if (width < 900) {
          setColumns(2);
        } else {
          setColumns(3);
        }
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight - gap;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleRows = Math.ceil(containerHeight / rowHeight) + 2 * overscan;
  const endRow = Math.min(totalRows, startRow + visibleRows);

  const visibleItems = [];
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < items.length) {
        const item = items[index];
        const itemStyle: React.CSSProperties = {
          position: 'absolute',
          top: row * rowHeight,
          left: col * (100 / columns) + '%',
          width: `calc(${100 / columns}% - ${gap * (columns - 1) / columns}%)`,
          height: itemHeight,
        };
        visibleItems.push(renderItem(item, index, itemStyle));
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        position: 'relative',
        overflowY: 'auto',
        height: '100%',
        width: '100%',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative', width: '100%' }}>
        {visibleItems}
      </div>
    </div>
  );
}
