import { useMemo } from 'react';
import { useGameStore } from './store';
import { COLORS, ColorValue } from './gameEngine';

const PARTICLE_COUNT = 6;
const PARTICLE_ANGLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => (360 / PARTICLE_COUNT) * i);

function Particle({ color, angle }: { color: string; angle: number }) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * 30;
  const dy = Math.sin(rad) * 30;

  return (
    <div
      className="chain-particle"
      style={{
        background: color,
        '--px': `${dx}px`,
        '--py': `${dy}px`,
      } as React.CSSProperties}
    />
  );
}

function Ball({ color, isExploding, isCelebrating }: { color: ColorValue; isExploding: boolean; isCelebrating: boolean }) {
  return (
    <div className={`ball ${isExploding ? 'ball-exploding' : ''} ${isCelebrating ? 'ball-celebrating' : ''}`}>
      <div
        className="ball-inner"
        style={{ background: color }}
      />
      {isExploding && (
        <>
          <div className="shockwave" style={{ borderColor: color }} />
          {PARTICLE_ANGLES.map((angle, i) => (
            <Particle key={i} color={color} angle={angle} />
          ))}
        </>
      )}
    </div>
  );
}

export default function Grid() {
  const grid = useGameStore(s => s.grid);
  const explodingCells = useGameStore(s => s.explodingCells);
  const isAnimating = useGameStore(s => s.isAnimating);
  const celebrating = useGameStore(s => s.celebrating);
  const handleCellClick = useGameStore(s => s.handleCellClick);

  const cellSize = useMemo(() => {
    const minSize = 40;
    const maxSize = 70;
    const available = Math.min(window.innerWidth - 280, window.innerHeight - 160);
    const calculated = Math.floor(available / 8);
    return Math.max(minSize, Math.min(maxSize, calculated));
  }, []);

  return (
    <div
      className="grid-container"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(8, ${cellSize}px)`,
        gridTemplateRows: `repeat(8, ${cellSize}px)`,
        gap: '1px',
        background: '#2C3E50',
        border: '2px solid #2C3E50',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const key = cell.id;
          const isExploding = explodingCells.has(`${r},${c}`);

          return (
            <div
              key={key}
              className="grid-cell"
              style={{
                width: cellSize,
                height: cellSize,
                background: '#1A1A2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: cell.color && !isAnimating ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'visible',
              }}
              onClick={() => handleCellClick(r, c)}
            >
              {cell.color && (
                <Ball color={cell.color} isExploding={isExploding} isCelebrating={celebrating} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
