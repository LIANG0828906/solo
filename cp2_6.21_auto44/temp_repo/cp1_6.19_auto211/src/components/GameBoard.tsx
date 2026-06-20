import { useMemo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  GRID_SIZE,
  NOTE_COLORS,
  WAVE_DURATION,
  WAVE_AMPLITUDE,
  COLOR_TRANSITION_DURATION,
} from '@/constants';
import { Position, WallWave } from '@/types';

const positionKey = (pos: Position): string => `${pos.x},${pos.y}`;

interface WallCellProps {
  x: number;
  y: number;
  cellSize: number;
  wave?: WallWave;
}

function WallCell({ x, y, cellSize, wave }: WallCellProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [bgColor, setBgColor] = useState('#3A3A4A');
  const animationRef = useRef<number | null>(null);
  const waveRef = useRef<WallWave | undefined>(wave);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    waveRef.current = wave;
    if (wave) {
      startTimeRef.current = performance.now();
      waveRef.current = { ...wave, startTime: startTimeRef.current };
    }
  }, [wave]);

  useEffect(() => {
    if (!waveRef.current) {
      setBgColor('#3A3A4A');
      setOffset({ x: 0, y: 0 });
      return;
    }

    const waveColor = NOTE_COLORS[waveRef.current.color as keyof typeof NOTE_COLORS];
    setBgColor(waveColor);

    const animate = () => {
      if (!waveRef.current) return;

      const elapsed = performance.now() - startTimeRef.current;
      const progress = Math.min(elapsed / WAVE_DURATION, 1);
      const angle = (progress * Math.PI * 2 * waveRef.current.frequency) / 30;
      const offsetX = WAVE_AMPLITUDE * Math.sin(angle) * (1 - progress);
      const offsetY = WAVE_AMPLITUDE * Math.cos(angle * 0.7) * (1 - progress);

      setOffset({ x: offsetX, y: offsetY });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setOffset({ x: 0, y: 0 });
        setBgColor('#3A3A4A');
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [wave]);

  return (
    <motion.div
      className="absolute"
      style={{
        left: x * cellSize,
        top: y * cellSize,
        width: cellSize,
        height: cellSize,
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}
      animate={{
        x: offset.x,
        y: offset.y,
        backgroundColor: bgColor,
      }}
      transition={{
        backgroundColor: { duration: COLOR_TRANSITION_DURATION, ease: 'easeInOut' },
        x: { duration: 0.016, ease: 'linear' },
        y: { duration: 0.016, ease: 'linear' },
      }}
    />
  );
}

interface PathCellProps {
  x: number;
  y: number;
  cellSize: number;
}

function PathCell({ x, y, cellSize }: PathCellProps) {
  return (
    <div
      className="absolute"
      style={{
        left: x * cellSize,
        top: y * cellSize,
        width: cellSize,
        height: cellSize,
        backgroundColor: 'rgba(30, 30, 50, 0.5)',
        border: '1px solid rgba(100, 100, 140, 0.2)',
      }}
    />
  );
}

interface GameBoardProps {
  cellSize: number;
}

export default function GameBoard({ cellSize }: GameBoardProps) {
  const grid = useGameStore((state) => state.grid);
  const wallWaves = useGameStore((state) => state.wallWaves);

  const boardWidth = GRID_SIZE * cellSize;
  const boardHeight = GRID_SIZE * cellSize;

  const cells = useMemo(() => {
    if (!grid || grid.length === 0) return null;

    const result: React.ReactNode[] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cellType = grid[y][x];
        const key = `${x}-${y}-${cellType}`;
        const waveKey = positionKey({ x, y });
        const wave = wallWaves.get(waveKey);

        if (cellType === 'wall') {
          result.push(
            <WallCell
              key={key}
              x={x}
              y={y}
              cellSize={cellSize}
              wave={wave}
            />
          );
        } else {
          result.push(
            <PathCell
              key={key}
              x={x}
              y={y}
              cellSize={cellSize}
            />
          );
        }
      }
    }

    return result;
  }, [grid, wallWaves, cellSize]);

  return (
    <div
      className="relative"
      style={{
        width: boardWidth,
        height: boardHeight,
        backgroundColor: '#151525',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '8px',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(0, 0, 0, 0.3)',
      }}
    >
      {cells}
    </div>
  );
}
