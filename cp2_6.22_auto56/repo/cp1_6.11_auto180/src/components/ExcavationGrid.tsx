import React, { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Fragment, Particle } from '../types';

const CELL_SIZE = 40;
const GRID_GAP = 1;

const shapeToPath = (shape: number[][], size: number): string => {
  if (shape.length === 0) return '';
  const points = shape.map(([x, y]) => `${(x + 0.5) * size},${(y + 0.5) * size}`).join(' ');
  return `polygon(${points})`;
};

const ExcavationGrid: React.FC = () => {
  const { grid, excavateCell, pickFragment, particles, updateParticles } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      updateParticles();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateParticles]);

  const handleCellClick = (x: number, y: number) => {
    const cell = grid[y][x];
    if (cell.isExcavated && cell.fragment && !cell.fragment.isPicked) {
      pickFragment(cell.fragment);
    } else if (!cell.isExcavated) {
      excavateCell(x, y);
    }
  };

  const renderFragment = (fragment: Fragment, cellX: number, cellY: number) => {
    if (fragment.isPicked) return null;
    
    return (
      <div
        className="fragment"
        style={{
          position: 'absolute',
          left: (CELL_SIZE - fragment.size) / 2,
          top: (CELL_SIZE - fragment.size) / 2,
          width: fragment.size,
          height: fragment.size,
          backgroundColor: fragment.color,
          clipPath: shapeToPath(fragment.shape, fragment.size),
          transform: `rotate(${fragment.rotation}deg)`,
          transition: 'transform 0.2s ease-out',
          cursor: 'pointer',
          animation: 'fragmentAppear 0.3s ease-out',
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(10, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(10, ${CELL_SIZE}px)`,
          gap: `${GRID_GAP}px`,
          backgroundColor: '#8B7355',
          padding: GRID_GAP,
          borderRadius: '4px',
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCellClick(x, y)}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: cell.isExcavated ? '#4A3728' : '#C2B280',
                transition: 'background-color 0.15s ease',
                cursor: cell.isExcavated && cell.fragment && !cell.fragment.isPicked ? 'pointer' : 'default',
                position: 'relative',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!cell.isExcavated) {
                  e.currentTarget.style.backgroundColor = '#D4C5A9';
                }
              }}
              onMouseLeave={(e) => {
                if (!cell.isExcavated) {
                  e.currentTarget.style.backgroundColor = '#C2B280';
                }
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {cell.isExcavated && cell.fragment && renderFragment(cell.fragment, x, y)}
            </div>
          ))
        )}
      </div>

      {particles.map((p: Particle) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
            pointerEvents: 'none',
            borderRadius: p.size <= 2 ? '50%' : '0',
          }}
        />
      ))}

      <style>{`
        @keyframes fragmentAppear {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
          }
          100% {
            transform: scale(1) rotate(var(--rotation, 0deg));
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ExcavationGrid;
