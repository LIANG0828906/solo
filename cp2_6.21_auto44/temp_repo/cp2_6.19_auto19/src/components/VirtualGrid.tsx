import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  gap?: number;
  minItemWidth?: number;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  overscan = 3,
  gap = 16,
  minItemWidth = 280,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [columns, setColumns] = useState(3);
  const [rowOffsets, setRowOffsets] = useState<number[]>([]);
  const _itemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const updateContainer = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateContainer();
    const resizeObserver = new ResizeObserver(updateContainer);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (containerWidth > 0) {
      const availableWidth = containerWidth + gap;
      const cols = Math.max(1, Math.floor(availableWidth / (minItemWidth + gap)));
      setColumns(cols);
    }
  }, [containerWidth, minItemWidth, gap]);

  useEffect(() => {
    const totalRows = Math.ceil(items.length / columns);
    const offsets: number[] = [];
    let currentOffset = 0;

    for (let row = 0; row < totalRows; row++) {
      offsets.push(currentOffset);
      let maxHeight = 0;
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < items.length) {
          const height = measuredHeights.get(index) || 380;
          maxHeight = Math.max(maxHeight, height);
        }
      }
      currentOffset += maxHeight + gap;
    }
    offsets.push(currentOffset - gap);
    setRowOffsets(offsets);
  }, [items.length, columns, measuredHeights, gap]);

  const measureItem = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) {
      const height = element.getBoundingClientRect().height;
      setMeasuredHeights((prev) => {
        if (prev.get(index) !== height) {
          const next = new Map(prev);
          next.set(index, height);
          return next;
        }
        return prev;
      });
    }
  }, []);

  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = rowOffsets.length > 0 ? rowOffsets[rowOffsets.length - 1] : 0;

  const startRow = Math.max(0, Math.floor(scrollTop / (rowOffsets[1] - rowOffsets[0] || 1)) - overscan);
  const containerHeight = scrollContainerRef.current?.clientHeight || 0;
  const endRow = Math.min(
    totalRows,
    startRow + Math.ceil((scrollTop + containerHeight) / (rowOffsets[1] - rowOffsets[0] || 1)) + overscan + 1
  );

  const visibleItems = [];
  for (let row = Math.max(0, startRow); row < Math.min(totalRows, endRow); row++) {
    const rowTop = rowOffsets[row] || 0;
    const rowHeight = (rowOffsets[row + 1] || rowOffsets[row] || 0) - rowTop;

    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < items.length) {
        const item = items[index];
        const itemStyle: React.CSSProperties = {
          position: 'absolute',
          top: rowTop,
          left: `calc(${col * (100 / columns)}% + ${col * gap / columns}px)`,
          width: `calc(${100 / columns}% - ${gap * (columns - 1) / columns}px)`,
          height: rowHeight,
        };

        visibleItems.push(
          <div
            key={index}
            ref={(el) => measureItem(index, el)}
            style={itemStyle}
          >
            {renderItem(item, index)}
          </div>
        );
      }
    }
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`,
    gap: `${gap}px`,
  };

  if (items.length <= 9) {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
        }}
      >
        <div style={gridStyle}>
          {items.map((item, index) => (
            <div key={index}>{renderItem(item, index)}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
    >
      <div
        ref={scrollContainerRef}
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
    </div>
  );
}
