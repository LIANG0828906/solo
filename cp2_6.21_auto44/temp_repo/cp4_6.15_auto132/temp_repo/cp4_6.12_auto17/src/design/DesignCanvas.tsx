import { useRef, useEffect, useState, useCallback } from 'react';
import { useDesignStore, GRID_ROWS, GRID_COLS, CELL_SIZE, STITCH_NAMES, StitchType } from './designStore';
import type { CellData } from './designStore';

interface DesignCanvasProps {
  patternId?: number | null;
  initialGrid?: CellData[][];
  onSave?: (grid: CellData[][], thumbnail: string) => void;
}

export default function DesignCanvas({ patternId, initialGrid, onSave }: DesignCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const [patternGrid, setPatternGrid] = useState<CellData[][]>(() => {
    if (initialGrid && initialGrid.length === GRID_ROWS) {
      return initialGrid;
    }
    return Array(GRID_ROWS).fill(null).map(() =>
      Array(GRID_COLS).fill(null).map(() => ({ stitch: 0 as StitchType, color: '' }))
    );
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastCell, setLastCell] = useState<{ row: number; col: number } | null>(null);
  
  const { activeStitch, activeColor, zoom, setZoom } = useDesignStore();

  const drawCell = useCallback((ctx: CanvasRenderingContext2D, row: number, col: number, cell: CellData, cellSize: number) => {
    const x = col * cellSize;
    const y = row * cellSize;

    if (cell.stitch === 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, y, cellSize, cellSize);
    } else {
      ctx.fillStyle = cell.color || '#D2B48C';
      ctx.fillRect(x, y, cellSize, cellSize);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      
      if (cell.stitch === 1) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + cellSize - 2);
        ctx.lineTo(x + cellSize - 2, y + 2);
        ctx.stroke();
      } else if (cell.stitch === 2) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + cellSize - 2, y + cellSize - 2);
        ctx.stroke();
      } else if (cell.stitch === 3) {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (cell.stitch === 4) {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.strokeStyle = 'rgba(139, 115, 85, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, cellSize, cellSize);
  }, []);

  const renderFullCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const offscreen = offscreenRef.current;
    if (!canvas || !offscreen) return;

    const ctx = canvas.getContext('2d');
    const offCtx = offscreen.getContext('2d');
    if (!ctx || !offCtx) return;

    const cellSize = CELL_SIZE * zoom;
    const width = GRID_COLS * cellSize;
    const height = GRID_ROWS * cellSize;

    canvas.width = width;
    canvas.height = height;
    offscreen.width = width;
    offscreen.height = height;

    offCtx.fillStyle = '#FFFFFF';
    offCtx.fillRect(0, 0, width, height);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        drawCell(offCtx, row, col, patternGrid[row][col], cellSize);
      }
    }

    ctx.drawImage(offscreen, 0, 0);
  }, [patternGrid, zoom, drawCell]);

  const updateCell = useCallback((row: number, col: number) => {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;

    setPatternGrid(prev => {
      const newGrid = prev.map(r => r.slice());
      const current = newGrid[row][col];
      
      if (activeStitch === 0) {
        newGrid[row][col] = { stitch: 0, color: '' };
      } else if (current.stitch === activeStitch && current.color === activeColor) {
        newGrid[row][col] = { stitch: 0, color: '' };
      } else {
        newGrid[row][col] = { stitch: activeStitch, color: activeColor };
      }

      const canvas = canvasRef.current;
      const offscreen = offscreenRef.current;
      if (canvas && offscreen) {
        const ctx = canvas.getContext('2d');
        const offCtx = offscreen.getContext('2d');
        if (ctx && offCtx) {
          const cellSize = CELL_SIZE * zoom;
          drawCell(offCtx, row, col, newGrid[row][col], cellSize);
          ctx.drawImage(
            offscreen,
            col * cellSize, row * cellSize, cellSize, cellSize,
            col * cellSize, row * cellSize, cellSize, cellSize
          );
        }
      }

      return newGrid;
    });
  }, [activeStitch, activeColor, zoom, drawCell]);

  const drawLine = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const dRow = Math.abs(toRow - fromRow);
    const dCol = Math.abs(toCol - fromCol);
    const sRow = fromRow < toRow ? 1 : -1;
    const sCol = fromCol < toCol ? 1 : -1;
    let err = dRow - dCol;
    let r = fromRow;
    let c = fromCol;

    while (true) {
      updateCell(r, c);
      if (r === toRow && c === toCol) break;
      const e2 = 2 * err;
      if (e2 > -dCol) { err -= dCol; r += sRow; }
      if (e2 < dRow) { err += dRow; c += sCol; }
    }
  }, [updateCell]);

  const getCellFromEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cellSize = CELL_SIZE * zoom;
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    const row = Math.floor((e.clientY - rect.top) / cellSize);
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      return { row, col };
    }
    return null;
  }, [zoom]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;
    setIsDrawing(true);
    setLastCell(cell);
    updateCell(cell.row, cell.col);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const cell = getCellFromEvent(e);
    if (!cell || !lastCell) return;
    if (cell.row !== lastCell.row || cell.col !== lastCell.col) {
      drawLine(lastCell.row, lastCell.col, cell.row, cell.col);
      setLastCell(cell);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastCell(null);
  };

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);

  const generateThumbnail = useCallback((): string => {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 128;
    thumbCanvas.height = 128;
    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return '';
    
    const scaleX = 128 / (GRID_COLS * CELL_SIZE);
    const scaleY = 128 / (GRID_ROWS * CELL_SIZE);
    const scale = Math.min(scaleX, scaleY);
    
    const cellSize = CELL_SIZE * scale;
    const offsetX = (128 - GRID_COLS * cellSize) / 2;
    const offsetY = (128 - GRID_ROWS * cellSize) / 2;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 128, 128);
    
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cell = patternGrid[row][col];
        if (cell.stitch !== 0) {
          ctx.fillStyle = cell.color || '#D2B48C';
          ctx.fillRect(
            offsetX + col * cellSize,
            offsetY + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
    
    return thumbCanvas.toDataURL('image/png');
  }, [patternGrid]);

  const handleSave = () => {
    const thumbnail = generateThumbnail();
    onSave?.(patternGrid, thumbnail);
  };

  const handleClear = () => {
    if (window.confirm('确定要清空画布吗？')) {
      const empty = Array(GRID_ROWS).fill(null).map(() =>
        Array(GRID_COLS).fill(null).map(() => ({ stitch: 0 as StitchType, color: '' }))
      );
      setPatternGrid(empty);
    }
  };

  useEffect(() => {
    offscreenRef.current = document.createElement('canvas');
  }, []);

  useEffect(() => {
    renderFullCanvas();
  }, [renderFullCanvas]);

  useEffect(() => {
    if (initialGrid && initialGrid.length === GRID_ROWS) {
      setPatternGrid(initialGrid);
    }
  }, [patternId]);

  const filledCells = patternGrid.flat().filter(c => c.stitch !== 0).length;

  return (
    <div className="design-canvas-wrapper">
      <div className="canvas-toolbar-top">
        <div className="canvas-info">
          <span>网格: {GRID_COLS} × {GRID_ROWS}</span>
          <span>已填充: {filledCells} 针</span>
          <span>缩放: {(zoom * 100).toFixed(0)}%</span>
        </div>
        <div className="canvas-actions">
          <button className="btn-secondary" onClick={handleClear}>清空画布</button>
          <button className="btn-primary" onClick={handleSave}>保存图案</button>
        </div>
      </div>

      <div className="canvas-container">
        <div className="zoom-control">
          <label>缩放</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="slider"
          />
        </div>
        <div className="canvas-scroll-wrapper">
          <canvas
            ref={canvasRef}
            className="design-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ transition: 'width 0.2s ease-out, height 0.2s ease-out' }}
          />
        </div>
      </div>

      <style>{`
        .design-canvas-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .canvas-toolbar-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .canvas-info {
          display: flex;
          gap: 24px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        .canvas-actions {
          display: flex;
          gap: 12px;
        }
        .canvas-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          padding: 20px;
        }
        .zoom-control {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        .zoom-control input {
          width: 200px;
        }
        .canvas-scroll-wrapper {
          overflow: auto;
          max-height: 70vh;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px;
        }
        .design-canvas {
          display: block;
          cursor: crosshair;
          image-rendering: pixelated;
        }
      `}</style>
    </div>
  );
}
