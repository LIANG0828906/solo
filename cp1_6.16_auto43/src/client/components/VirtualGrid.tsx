import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SeedItem } from '../../types';
import SeedCard from './SeedCard';

interface VirtualGridProps {
  items: SeedItem[];
  currentUser: string;
  onExchange: (item: SeedItem) => void;
}

const CARD_ESTIMATED_HEIGHT = 350;
const BUFFER = 300;

const VirtualGrid: React.FC<VirtualGridProps> = ({ items, currentUser, onExchange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
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

  const getColumns = useCallback(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth > 1200) return 4;
    if (window.innerWidth > 900) return 3;
    if (window.innerWidth > 768) return 2;
    return 1;
  }, []);

  const [columns, setColumns] = useState(getColumns());

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getColumns]);

  const visibleStart = Math.max(0, Math.floor((scrollTop - BUFFER) / CARD_ESTIMATED_HEIGHT));
  const visibleEnd = Math.ceil((scrollTop + containerHeight + BUFFER) / CARD_ESTIMATED_HEIGHT);

  const visibleItems = useMemo(() => {
    const startIdx = Math.floor(visibleStart) * columns;
    const endIdx = Math.ceil(visibleEnd) * columns + columns * 2;
    return items.slice(startIdx, endIdx);
  }, [items, visibleStart, visibleEnd, columns]);

  const totalHeight = useMemo(() => {
    const rows = Math.ceil(items.length / columns);
    return rows * CARD_ESTIMATED_HEIGHT;
  }, [items.length, columns]);

  const getItemOffsetTop = (index: number) => {
    const row = Math.floor(index / columns);
    return row * CARD_ESTIMATED_HEIGHT;
  };

  const getItemOffsetLeft = (index: number) => {
    const col = index % columns;
    return `${col * (100 / columns)}%`;
  };

  return (
    <div
      ref={containerRef}
      className="grid-container"
      onScroll={handleScroll}
      style={{ height: 'calc(100vh - 400px)', overflowY: 'auto' }}
    >
      <div className="grid-wrapper" style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          {visibleItems.map((item) => {
            const originalIndex = items.indexOf(item);
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  top: getItemOffsetTop(originalIndex),
                  left: getItemOffsetLeft(originalIndex),
                  width: `${100 / columns}%`,
                  padding: '0 10px',
                  animationDelay: `${(originalIndex % 20) * 0.05}s`,
                }}
              >
                <SeedCard item={item} currentUser={currentUser} onExchange={onExchange} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualGrid;
