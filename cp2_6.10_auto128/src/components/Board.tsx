import React, { useRef, useEffect, useCallback, useState } from 'react';
import { StoneColor, Position, AnimatedStone } from '../types';
import { useGameStore } from '../store/useGameStore';

interface BoardProps {
  board: StoneColor[][];
  boardSize: number;
  cellSize: number;
  starPoints: Position[];
  lastMove: Position | null;
  onCellClick: (pos: Position) => void;
  disabled: boolean;
  animatedStones: AnimatedStone[];
}

const WOOD_COLOR = '#e8c98a';
const WOOD_DARK_COLOR = '#d4b56f';
const LINE_COLOR = '#c8a96e';
const STAR_COLOR = '#3e2723';

export const Board: React.FC<BoardProps> = ({
  board,
  boardSize,
  cellSize,
  starPoints,
  lastMove,
  onCellClick,
  disabled,
  animatedStones
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState(0);
  const removeAnimatedStone = useGameStore(state => state.removeAnimatedStone);

  useEffect(() => {
    const handleResize = () => {
      const boardSection = document.querySelector('.board-section');
      if (boardSection) {
        const maxWidth = window.innerWidth < 768
          ? window.innerWidth - 40
          : (window.innerWidth * 0.6) - 80;
        const calculatedSize = Math.min(maxWidth, boardSize * cellSize);
        const cellBasedSize = Math.floor(calculatedSize / boardSize) * boardSize;
        setCanvasSize(cellBasedSize);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [boardSize, cellSize]);

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D, size: number) => {
    const actualCellSize = size / boardSize;
    const padding = actualCellSize / 2;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, WOOD_COLOR);
    gradient.addColorStop(0.5, WOOD_DARK_COLOR);
    gradient.addColorStop(1, WOOD_COLOR);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 1;

    for (let i = 0; i < boardSize; i++) {
      const pos = padding + i * actualCellSize;
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, size - padding);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(size - padding, pos);
      ctx.stroke();
    }

    ctx.fillStyle = STAR_COLOR;
    for (const star of starPoints) {
      const x = padding + star.x * actualCellSize;
      const y = padding + star.y * actualCellSize;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [boardSize, starPoints]);

  const drawStone = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: StoneColor,
    alpha: number = 1,
    isLast: boolean = false
  ) => {
    ctx.globalAlpha = alpha;

    const radius = (canvasSize / boardSize) * 0.42;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const gradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );

    if (color === StoneColor.Black) {
      gradient.addColorStop(0, '#5a5a5a');
      gradient.addColorStop(0.5, '#2a2a2a');
      gradient.addColorStop(1, '#000000');
    } else {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.7, '#e0e0e0');
      gradient.addColorStop(1, '#b0b0b0');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (color === StoneColor.White) {
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (isLast) {
      ctx.strokeStyle = color === StoneColor.Black ? '#ff4444' : '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }, [canvasSize, boardSize]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvasSize;
    const actualCellSize = size / boardSize;
    const padding = actualCellSize / 2;

    ctx.clearRect(0, 0, size, size);
    drawBoard(ctx, size);

    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const stone = board[y][x];
        if (stone !== StoneColor.Empty) {
          const px = padding + x * actualCellSize;
          const py = padding + y * actualCellSize;
          const isLast = lastMove ? lastMove.x === x && lastMove.y === y : false;
          drawStone(ctx, px, py, stone, 1, isLast);
        }
      }
    }

    const now = performance.now();
    const completedAnimations: Position[] = [];

    for (const anim of animatedStones) {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const alpha = easeOutCubic(progress);

      const px = padding + anim.position.x * actualCellSize;
      const py = padding + anim.position.y * actualCellSize;
      const isLast = lastMove ? lastMove.x === anim.position.x && lastMove.y === anim.position.y : false;
      drawStone(ctx, px, py, anim.color, alpha, isLast);

      if (progress >= 1) {
        completedAnimations.push(anim.position);
      }
    }

    for (const pos of completedAnimations) {
      removeAnimatedStone(pos);
    }

    if (animatedStones.length > 0) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [canvasSize, boardSize, board, starPoints, lastMove, animatedStones, drawBoard, drawStone, removeAnimatedStone]);

  useEffect(() => {
    if (canvasSize > 0) {
      render();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasSize, render]);

  useEffect(() => {
    if (animatedStones.length > 0 && animationFrameRef.current === 0) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [animatedStones, render]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || canvasSize === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const actualCellSize = canvasSize / boardSize;
    const padding = actualCellSize / 2;

    const gridX = Math.round((x - padding) / actualCellSize);
    const gridY = Math.round((y - padding) / actualCellSize);

    if (gridX >= 0 && gridX < boardSize && gridY >= 0 && gridY < boardSize) {
      onCellClick({ x: gridX, y: gridY });
    }
  }, [disabled, canvasSize, boardSize, onCellClick]);

  if (canvasSize === 0) {
    return <div style={{ width: '100%', aspectRatio: '1/1' }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="board-canvas"
      onClick={handleClick}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: canvasSize,
        height: canvasSize
      }}
    />
  );
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
