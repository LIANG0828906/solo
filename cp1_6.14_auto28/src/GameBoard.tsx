import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Grid,
  GridCell,
  GRID_SIZE,
  ANIMAL_CONFIGS,
  canMerge,
  mergeCells,
  MergeAnimation,
} from './utils';
import { useMergeAnimation } from './hooks/useMergeAnimation';

type GameBoardProps = {
  grid: Grid;
  onMerge: (newGrid: Grid, newLevel: number) => void;
  disabled?: boolean;
};

const GAP = 8;
const BASE_CELL_SIZE = 80;

export const GameBoard: React.FC<GameBoardProps> = ({ grid, onMerge, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [draggingCell, setDraggingCell] = useState<{ row: number; col: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cellSize, setCellSize] = useState(BASE_CELL_SIZE);
  const renderFrameRef = useRef<number | null>(null);

  const { activeAnimations, getAnimationFrame, startMergeAnimation, isAnimating } = useMergeAnimation();

  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const availableSize = Math.min(containerWidth - 32, 400);
    const newCellSize = Math.floor((availableSize - GAP * (GRID_SIZE - 1)) / GRID_SIZE);
    const totalSize = newCellSize * GRID_SIZE + GAP * (GRID_SIZE - 1);
    
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = totalSize * dpr;
    canvasRef.current.height = totalSize * dpr;
    canvasRef.current.style.width = `${totalSize}px`;
    canvasRef.current.style.height = `${totalSize}px`;
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    setCanvasSize({ width: totalSize, height: totalSize });
    setCellSize(newCellSize);
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  const getCellFromCoords = useCallback((clientX: number, clientY: number): { row: number; col: number } | null => {
    if (!canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left);
    const y = (clientY - rect.top);
    
    const col = Math.floor(x / (cellSize + GAP));
    const row = Math.floor(y / (cellSize + GAP));
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      const cellX = col * (cellSize + GAP);
      const cellY = row * (cellSize + GAP);
      if (x < cellX + cellSize && y < cellY + cellSize) {
        return { row, col };
      }
    }
    return null;
  }, [cellSize]);

  const drawPixelAnimal = useCallback((
    ctx: CanvasRenderingContext2D,
    cell: GridCell,
    x: number,
    y: number,
    size: number,
    scale: number = 1
  ) => {
    if (!cell) return;
    
    const config = ANIMAL_CONFIGS[cell.level];
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const scaledSize = size * scale;
    const padding = scaledSize * 0.1;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    ctx.fillStyle = config.bgColor;
    ctx.beginPath();
    ctx.roundRect(-scaledSize / 2 + padding, -scaledSize / 2 + padding, scaledSize - padding * 2, scaledSize - padding * 2, scaledSize * 0.15);
    ctx.fill();
    
    ctx.strokeStyle = config.color;
    ctx.lineWidth = Math.max(2, scaledSize * 0.03);
    ctx.stroke();
    
    ctx.font = `${scaledSize * 0.6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.emoji, 0, scaledSize * 0.05);
    
    ctx.fillStyle = config.color;
    ctx.font = `bold ${scaledSize * 0.2}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`Lv.${cell.level}`, scaledSize / 2 - padding - 2, scaledSize / 2 - padding - 2);
    
    ctx.restore();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * (cellSize + GAP);
        const y = row * (cellSize + GAP);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 8);
        ctx.fill();
        
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        const cell = grid[row][col];
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        const isDragging = draggingCell?.row === row && draggingCell?.col === col;
        
        if (cell && !isDragging) {
          if (isSelected) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            drawPixelAnimal(ctx, cell, x, y, cellSize, 1.05);
            ctx.restore();
          } else {
            drawPixelAnimal(ctx, cell, x, y, cellSize);
          }
        }
      }
    }
    
    activeAnimations.forEach(anim => {
      const frame = getAnimationFrame(anim, cellSize, GAP);
      const animCell: GridCell = {
        id: anim.id,
        level: anim.level,
        row: anim.toRow,
        col: anim.toCol,
      };
      
      if (frame.flashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = frame.flashAlpha;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(frame.x, frame.y, cellSize * 0.6 * frame.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      drawPixelAnimal(ctx, animCell, frame.x - cellSize / 2, frame.y - cellSize / 2, cellSize, frame.scale);
    });
    
    if (draggingCell && grid[draggingCell.row][draggingCell.col]) {
      const cell = grid[draggingCell.row][draggingCell.col]!;
      const dragX = dragOffset.x - cellSize / 2;
      const dragY = dragOffset.y - cellSize / 2;
      
      ctx.save();
      ctx.shadowColor = '#A8D8EA';
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.9;
      drawPixelAnimal(ctx, cell, dragX, dragY, cellSize, 1.1);
      ctx.restore();
    }
    
    renderFrameRef.current = requestAnimationFrame(render);
  }, [canvasSize, cellSize, grid, selectedCell, draggingCell, dragOffset, activeAnimations, getAnimationFrame, drawPixelAnimal]);

  useEffect(() => {
    renderFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, [render]);

  const attemptMerge = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    if (disabled || isAnimating) return;
    if (!canMerge(grid, r1, c1, r2, c2)) return;
    
    const result = mergeCells(grid, r1, c1, r2, c2);
    if (result.success) {
      startMergeAnimation(r1, c1, r2, c2, grid[r1][c1]!.level);
      setTimeout(() => {
        onMerge(result.grid, result.newLevel);
      }, 150);
    }
  }, [grid, onMerge, disabled, isAnimating, startMergeAnimation]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || isAnimating) return;
    
    const cell = getCellFromCoords(e.clientX, e.clientY);
    if (!cell || !grid[cell.row][cell.col]) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggingCell(cell);
    setSelectedCell(cell);
  }, [grid, getCellFromCoords, disabled, isAnimating]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingCell || disabled || isAnimating) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [draggingCell, disabled, isAnimating]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || isAnimating) return;
    
    if (draggingCell) {
      const targetCell = getCellFromCoords(e.clientX, e.clientY);
      if (targetCell && (targetCell.row !== draggingCell.row || targetCell.col !== draggingCell.col)) {
        attemptMerge(draggingCell.row, draggingCell.col, targetCell.row, targetCell.col);
      }
      setDraggingCell(null);
    } else if (selectedCell) {
      const clickedCell = getCellFromCoords(e.clientX, e.clientY);
      if (clickedCell && clickedCell.row === selectedCell.row && clickedCell.col === selectedCell.col) {
        setSelectedCell(null);
      } else if (clickedCell && grid[clickedCell.row][clickedCell.col]) {
        attemptMerge(selectedCell.row, selectedCell.col, clickedCell.row, clickedCell.col);
        setSelectedCell(null);
      }
    }
  }, [draggingCell, selectedCell, grid, getCellFromCoords, attemptMerge, disabled, isAnimating]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (disabled || isAnimating) return;
    
    const touch = e.touches[0];
    const cell = getCellFromCoords(touch.clientX, touch.clientY);
    if (!cell || !grid[cell.row][cell.col]) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setDraggingCell(cell);
    setSelectedCell(cell);
  }, [grid, getCellFromCoords, disabled, isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!draggingCell || disabled || isAnimating) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  }, [draggingCell, disabled, isAnimating]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (disabled || isAnimating) return;
    
    if (draggingCell) {
      const touch = e.changedTouches[0];
      const targetCell = getCellFromCoords(touch.clientX, touch.clientY);
      if (targetCell && (targetCell.row !== draggingCell.row || targetCell.col !== draggingCell.col)) {
        attemptMerge(draggingCell.row, draggingCell.col, targetCell.row, targetCell.col);
      }
      setDraggingCell(null);
    }
  }, [draggingCell, getCellFromCoords, attemptMerge, disabled, isAnimating]);

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        padding: '16px',
        backgroundColor: '#A8D8EA',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          cursor: draggingCell ? 'grabbing' : 'grab',
          touchAction: 'none',
          willChange: 'transform',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default GameBoard;
