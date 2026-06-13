import { useRef, useEffect, useState, useCallback } from 'react';
import PlantCard from './PlantCard';
import type { Plant } from '../types';

interface VirtualPlantListProps {
  plants: Plant[];
  onPlantClick: (plant: Plant) => void;
  itemHeight?: number;
}

export default function VirtualPlantList({
  plants,
  onPlantClick,
  itemHeight = 260,
}: VirtualPlantListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [columns, setColumns] = useState(2);
  const gap = 16;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
        const width = containerRef.current.clientWidth;
        if (width < 480) setColumns(1);
        else setColumns(2);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(plants.length / columns);
  const totalHeight = totalRows * rowHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const visibleRows = Math.ceil(containerHeight / rowHeight) + 4;
  const endRow = Math.min(totalRows, startRow + visibleRows);

  const visiblePlants: { plant: Plant; index: number; col: number; row: number }[] = [];
  for (let r = startRow; r < endRow; r++) {
    for (let c = 0; c < columns; c++) {
      const idx = r * columns + c;
      if (idx < plants.length) {
        visiblePlants.push({ plant: plants[idx], index: idx, col: c, row: r });
      }
    }
  }

  const itemWidth = `calc((100% - ${(columns - 1) * gap}px) / ${columns})`;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: '100%',
        overflowY: 'auto',
        paddingRight: 8,
      }}
      onScroll={handleScroll}
      className="plant-list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visiblePlants.map(({ plant, col, row }) => (
          <div
            key={plant.id}
            style={{
              position: 'absolute',
              top: row * rowHeight,
              left: col === 0 ? 0 : `calc(${itemWidth} + ${gap}px)`,
              width: itemWidth,
              height: itemHeight,
            }}
          >
            <PlantCard plant={plant} onClick={() => onPlantClick(plant)} />
          </div>
        ))}
      </div>
    </div>
  );
}
