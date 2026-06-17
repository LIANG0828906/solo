import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CellState, Player, BOARD_SIZE } from './types';

interface BoardRendererProps {
  board: CellState[][];
  currentPlayer: Player;
  selectedCell: { row: number; col: number } | null;
  canPlace: (row: number, col: number) => boolean;
  onCellClick: (row: number, col: number) => void;
  boardRotation: number;
  isRotating: boolean;
  flashPhase: number;
  borderHue: number;
  particles: Array<{
    x: number;
    y: number;
    size: number;
    life: number;
    maxLife: number;
    color: string;
  }>;
  isComboActive: boolean;
  beatOffset: number;
  beatProgress: number;
}

const PLAYER1_COLOR = '#4A90D9';
const PLAYER2_COLOR = '#D94A4A';
const CELL_DEFAULT = '#2A2E3E';
const HIGHLIGHT_COLOR = '#FFF3CD';
const PULSE_COLOR = '#00E5FF';
const GRID_LINE_OPACITY = 0.2;
const TERRITORY_OPACITY = 0.3;
const COMBO_GLOW_COLOR = '#FFD700';

export const BoardRenderer: React.FC<BoardRendererProps> = ({
  board,
  currentPlayer,
  selectedCell,
  canPlace,
  onCellClick,
  boardRotation,
  isRotating,
  flashPhase,
  borderHue,
  particles,
  isComboActive,
  beatProgress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(60);
  const animationRef = useRef<number>();

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current.parentElement;
        if (container) {
          const availableWidth = container.clientWidth - 80;
          const availableHeight = container.clientHeight - 120;
          const minSize = Math.min(availableWidth, availableHeight);
          const size = Math.max(40, Math.floor(minSize / BOARD_SIZE));
          setCellSize(size);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getShakeOffset = useCallback((cell: CellState, now: number): number => {
    if (!cell.isShaking) return 0;
    const elapsed = now - cell.shakeStartTime;
    if (elapsed > 200) return 0;
    return Math.sin(elapsed * 0.05) * 3;
  }, []);

  const isCellFlashing = useCallback((cell: CellState, now: number): boolean => {
    if (!cell.isFlashing) return false;
    const elapsed = now - cell.flashStartTime;
    return elapsed < 300;
  }, []);

  const shouldFlashWhite = useCallback((cell: CellState, phase: number): boolean => {
    if (!isRotating || cell.owner !== currentPlayer) return false;
    return phase % 2 === 1;
  }, [isRotating, currentPlayer, flashPhase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const boardPixelSize = cellSize * BOARD_SIZE;
    canvas.width = boardPixelSize;
    canvas.height = boardPixelSize;

    const render = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const cell = board[row][col];
          const x = col * cellSize;
          const y = row * cellSize;
          const shakeOffset = getShakeOffset(cell, now);

          ctx.fillStyle = CELL_DEFAULT;
          ctx.fillRect(x + shakeOffset, y, cellSize - 1, cellSize - 1);

          if (cell.isTerritory && cell.territoryOwner) {
            const territoryColor = cell.territoryOwner === 'player1' ? PLAYER1_COLOR : PLAYER2_COLOR;
            ctx.fillStyle = territoryColor + Math.floor(TERRITORY_OPACITY * 255).toString(16).padStart(2, '0');
            ctx.fillRect(x + shakeOffset, y, cellSize - 1, cellSize - 1);
          }

          if (canPlace(row, col) && !selectedCell) {
            ctx.fillStyle = HIGHLIGHT_COLOR + '60';
            ctx.fillRect(x + shakeOffset, y, cellSize - 1, cellSize - 1);
          }

          if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            ctx.strokeStyle = HIGHLIGHT_COLOR;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2 + shakeOffset, y + 2, cellSize - 5, cellSize - 5);
          }

          if (cell.owner) {
            const pieceColor = cell.owner === 'player1' ? PLAYER1_COLOR : PLAYER2_COLOR;
            const centerX = x + cellSize / 2 + shakeOffset;
            const centerY = y + cellSize / 2;
            const pieceRadius = (cellSize * 0.35) * cell.scale;

            const pulseScale = 1 + Math.sin(beatProgress * Math.PI * 2) * 0.15;
            const pulseRadius = pieceRadius * pulseScale * 1.3;
            const gradient = ctx.createRadialGradient(centerX, centerY, pieceRadius * 0.8, centerX, centerY, pulseRadius);
            gradient.addColorStop(0, PULSE_COLOR + '66');
            gradient.addColorStop(1, PULSE_COLOR + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
            ctx.fill();

            let fillColor = pieceColor;
            if (isCellFlashing(cell, now)) {
              fillColor = cell.flashColor;
            }
            if (shouldFlashWhite(cell, flashPhase)) {
              fillColor = '#FFFFFF';
            }

            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pieceRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.strokeStyle = `rgba(255, 255, 255, ${GRID_LINE_OPACITY})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + shakeOffset, y, cellSize - 1, cellSize - 1);
        }
      }

      particles.forEach((p) => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(
          p.x * cellSize,
          p.y * cellSize,
          p.size * alpha,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [board, cellSize, canPlace, selectedCell, particles, beatProgress, flashPhase, isRotating, currentPlayer, getShakeOffset, isCellFlashing, shouldFlashWhite]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      onCellClick(row, col);
    }
  };

  const boardPixelSize = cellSize * BOARD_SIZE;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${boardRotation}deg)`,
        transition: isRotating ? 'none' : 'transform 0.3s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: boardPixelSize + 12,
          height: boardPixelSize + 12,
          borderRadius: '8px',
          background: `conic-gradient(from ${borderHue}deg, hsl(${borderHue}, 100%, 60%), hsl(${(borderHue + 60) % 360}, 100%, 60%), hsl(${(borderHue + 120) % 360}, 100%, 60%), hsl(${(borderHue + 180) % 360}, 100%, 60%), hsl(${(borderHue + 240) % 360}, 100%, 60%), hsl(${(borderHue + 300) % 360}, 100%, 60%), hsl(${borderHue}, 100%, 60%))`,
          padding: '2px',
          boxSizing: 'border-box',
          filter: isComboActive ? `drop-shadow(0 0 20px ${COMBO_GLOW_COLOR})` : 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#0A0E1A',
            borderRadius: '6px',
          }}
        />
      </div>

      {isComboActive && (
        <div
          style={{
            position: 'absolute',
            width: boardPixelSize + 30,
            height: boardPixelSize + 30,
            borderRadius: '50%',
            background: `radial-gradient(circle, transparent 50%, ${COMBO_GLOW_COLOR}80 100%)`,
            animation: 'comboGlow 1s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: boardPixelSize,
          height: boardPixelSize,
          cursor: 'pointer',
          borderRadius: '4px',
          zIndex: 1,
        }}
      />
    </div>
  );
};
