import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useGameStore,
  CELL_COLOR_DEFAULT,
  CELL_COLOR_ACTIVE,
  CellState,
} from '../store/gameStore';
import { GRID_SIZE } from '../utils/patternGenerator';
import ParticleEffect from './ParticleEffect';

interface GameBoardProps {
  grid: CellState[];
  targetPattern: number[];
  shakeTrigger: number;
}

const CELL_GAP = 2;
const GRID_LINE_COLOR = '#2A2A2A';
const GRID_LINE_THICKNESS = 1;

const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  targetPattern,
  shakeTrigger,
}) => {
  const handleCellClick = useGameStore((s) => s.handleCellClick);
  const particles = useGameStore((s) => s.particles);
  const scorePopups = useGameStore((s) => s.scorePopups);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cellSize, setCellSize] = useState(60);
  const [shakeKey, setShakeKey] = useState(0);
  const prevShakeRef = useRef(shakeTrigger);

  useEffect(() => {
    if (shakeTrigger !== prevShakeRef.current) {
      prevShakeRef.current = shakeTrigger;
      setShakeKey((k) => k + 1);
    }
  }, [shakeTrigger]);

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const maxBoardWidth = Math.min(1200, Math.max(320, vw - 40));
      const availableForCells =
        maxBoardWidth - CELL_GAP * (GRID_SIZE - 1) - GRID_LINE_THICKNESS * 2;
      const size = Math.max(
        40,
        Math.min(60, Math.floor(availableForCells / GRID_SIZE))
      );
      setCellSize(size);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const boardSize = useMemo(
    () => cellSize * GRID_SIZE + CELL_GAP * (GRID_SIZE - 1) + GRID_LINE_THICKNESS * 2,
    [cellSize]
  );

  const onCellInteract = useCallback(
    (e: React.MouseEvent | React.TouchEvent, index: number) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      const cellCenterX =
        GRID_LINE_THICKNESS +
        col * (cellSize + CELL_GAP) +
        cellSize / 2;
      const cellCenterY =
        GRID_LINE_THICKNESS +
        row * (cellSize + CELL_GAP) +
        cellSize / 2;
      handleCellClick(index, cellCenterX, cellCenterY);
    },
    [cellSize, handleCellClick]
  );

  const targetSet = useMemo(() => new Set(targetPattern), [targetPattern]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: boardSize,
          height: boardSize,
          padding: GRID_LINE_THICKNESS,
          backgroundColor: GRID_LINE_COLOR,
          borderRadius: 8,
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.08)',
          animation:
            shakeTrigger > 0 ? `boardShake 0.3s ease` : 'none',
        }}
        key={`board-${shakeKey}`}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            gap: CELL_GAP,
            width: '100%',
            height: '100%',
          }}
        >
          {grid.map((cell, index) => {
            const isTarget = targetSet.has(index);
            const color =
              cell.isActive || cell.isMatched
                ? CELL_COLOR_ACTIVE
                : CELL_COLOR_DEFAULT;
            const glowColor = CELL_COLOR_ACTIVE;
            return (
              <div
                key={index}
                onMouseDown={(e) => onCellInteract(e, index)}
                onTouchStart={(e) => onCellInteract(e, index)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 4,
                  backgroundColor: color,
                  opacity: cell.isActive || cell.isMatched ? 1 : 0.6,
                  transition:
                    'background-color 0.3s ease, opacity 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  boxShadow:
                    cell.isActive || cell.isMatched
                      ? `0 0 ${cellSize * 0.2}px ${glowColor}, inset 0 0 ${cellSize * 0.1}px rgba(255,255,255,0.1)`
                      : isTarget
                        ? `0 0 6px ${glowColor}`
                        : 'none',
                  outline:
                    isTarget && !cell.isActive && !cell.isMatched
                      ? `1px dashed ${glowColor}80`
                      : 'none',
                  animation: cell.isMatched
                    ? 'cellBurst 0.3s ease forwards'
                    : cell.isWrong
                      ? 'cellShake 0.3s ease'
                      : 'none',
                  transform: cell.isWrong ? undefined : undefined,
                  willChange: 'transform, opacity, background-color',
                }}
              />
            );
          })}
        </div>

        <ParticleEffect particles={particles} scorePopups={scorePopups} />
      </div>
    </div>
  );
};

export default React.memo(GameBoard);
