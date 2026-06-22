import React, { useRef, useEffect, useCallback } from 'react';

export interface MatrixCellData {
  fgHex: string;
  bgHex: string;
  ratio: number;
}

interface HeatmapMatrixProps {
  matrix: MatrixCellData[][];
  foregroundHexes: string[];
  backgroundHexes: string[];
  onCellClick: (row: number, col: number) => void;
  selectedCell: { row: number; col: number } | null;
}

function ratioToColor(ratio: number): string {
  if (ratio < 3.0) {
    const t = ratio / 3.0;
    const r = Math.round(255);
    const g = Math.round(t * 200);
    const b = Math.round(t * 50);
    return `rgb(${r},${g},${b})`;
  } else if (ratio < 4.5) {
    const t = (ratio - 3.0) / 1.5;
    const r = Math.round(255 - t * 155);
    const g = Math.round(200 + t * 55);
    const b = Math.round(50 - t * 50);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = Math.min((ratio - 4.5) / 5.5, 1);
    const r = Math.round(100 - t * 68);
    const g = Math.round(255 - t * 45);
    const b = Math.round(t * 20);
    return `rgb(${r},${g},${b})`;
  }
}

function getTextColor(ratio: number): string {
  if (ratio < 3.0) return '#FFFFFF';
  return '#1E1E2E';
}

const CELL_WIDTH = 72;
const CELL_HEIGHT = 56;
const HEADER_WIDTH = 72;
const HEADER_HEIGHT = 56;
const FONT_SIZE = 12;

const HeatmapMatrix: React.FC<HeatmapMatrixProps> = ({
  matrix,
  foregroundHexes,
  backgroundHexes,
  onCellClick,
  selectedCell,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<{ row: number; col: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cols = backgroundHexes.length;
  const rows = foregroundHexes.length;
  const canvasWidth = HEADER_WIDTH + cols * CELL_WIDTH;
  const canvasHeight = HEADER_HEIGHT + rows * CELL_HEIGHT;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1E1E2E';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let c = 0; c < cols; c++) {
      const x = HEADER_WIDTH + c * CELL_WIDTH;
      ctx.fillStyle = '#2A2A3E';
      ctx.fillRect(x, 0, CELL_WIDTH, HEADER_HEIGHT);
      ctx.fillStyle = backgroundHexes[c];
      const swatchSize = 20;
      const sx = x + (CELL_WIDTH - swatchSize) / 2;
      const sy = 6;
      ctx.beginPath();
      ctx.roundRect(sx, sy, swatchSize, swatchSize, 4);
      ctx.fillStyle = backgroundHexes[c];
      ctx.fill();
      ctx.fillStyle = '#E0E0F0';
      ctx.font = `10px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(backgroundHexes[c], x + CELL_WIDTH / 2, sy + swatchSize + 12);
    }

    for (let r = 0; r < rows; r++) {
      const y = HEADER_HEIGHT + r * CELL_HEIGHT;
      ctx.fillStyle = '#2A2A3E';
      ctx.fillRect(0, y, HEADER_WIDTH, CELL_HEIGHT);
      const swatchSize = 20;
      const sx = (HEADER_WIDTH - swatchSize) / 2;
      const sy = y + 4;
      ctx.beginPath();
      ctx.roundRect(sx, sy, swatchSize, swatchSize, 4);
      ctx.fillStyle = foregroundHexes[r];
      ctx.fill();
      ctx.fillStyle = '#E0E0F0';
      ctx.font = `10px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(foregroundHexes[r], HEADER_WIDTH / 2, sy + swatchSize + 10);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = matrix[r]?.[c];
        if (!cell) continue;
        const x = HEADER_WIDTH + c * CELL_WIDTH;
        const y = HEADER_HEIGHT + r * CELL_HEIGHT;

        const isHovered = hoverRef.current?.row === r && hoverRef.current?.col === c;
        const isSelected = selectedCell?.row === r && selectedCell?.col === c;

        ctx.save();
        if (isHovered || isSelected) {
          ctx.translate(x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2);
          ctx.scale(1.1, 1.1);
          ctx.translate(-(x + CELL_WIDTH / 2), -(y + CELL_HEIGHT / 2));
        }

        ctx.fillStyle = ratioToColor(cell.ratio);
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, CELL_WIDTH - 4, CELL_HEIGHT - 4, 6);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#6366F1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, CELL_WIDTH - 4, CELL_HEIGHT - 4, 6);
          ctx.stroke();
        } else if (isHovered) {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, CELL_WIDTH - 4, CELL_HEIGHT - 4, 6);
          ctx.stroke();
        }

        ctx.fillStyle = getTextColor(cell.ratio);
        ctx.font = `bold ${FONT_SIZE}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.ratio.toFixed(1), x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2);

        ctx.restore();
      }
    }
  }, [matrix, foregroundHexes, backgroundHexes, selectedCell, cols, rows, canvasWidth, canvasHeight]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCellFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor((x - HEADER_WIDTH) / CELL_WIDTH);
      const row = Math.floor((y - HEADER_HEIGHT) / CELL_HEIGHT);
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        return { row, col };
      }
      return null;
    },
    [rows, cols]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const cell = getCellFromEvent(e);
      if (cell) onCellClick(cell.row, cell.col);
    },
    [getCellFromEvent, onCellClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const cell = getCellFromEvent(e);
      const prev = hoverRef.current;
      if (
        (!prev && !cell) ||
        (prev && cell && prev.row === cell.row && prev.col === cell.col)
      ) {
        return;
      }
      hoverRef.current = cell;
      draw();
    },
    [getCellFromEvent, draw]
  );

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = null;
    draw();
  }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{
        overflow: 'auto',
        height: '100%',
        width: '100%',
        background: '#1E1E2E',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', cursor: 'pointer' }}
      />
    </div>
  );
};

export default HeatmapMatrix;
