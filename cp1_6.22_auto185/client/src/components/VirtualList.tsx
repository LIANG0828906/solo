import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 5,
  className = '',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    let lastTime = 0;
    let rafId: number;

    const throttledScroll = () => {
      const now = performance.now();
      if (now - lastTime >= 33) {
        handleScroll();
        lastTime = now;
      } else {
        rafId = requestAnimationFrame(() => {
          handleScroll();
          lastTime = performance.now();
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', throttledScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', throttledScroll);
      }
      cancelAnimationFrame(rafId);
    };
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{ height }}
    >
      <div
        className="virtual-list-spacer"
        style={{ height: totalHeight }}
      />
      <div
        style={{
          transform: `translateY(${startIndex * itemHeight}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        {visibleItems.map((item, i) => (
          <div
            key={startIndex + i}
            className="virtual-list-item"
            style={{ height: itemHeight }}
          >
            {renderItem(item, startIndex + i)}
          </div>
        ))}
      </div>
    </div>
  );
}
