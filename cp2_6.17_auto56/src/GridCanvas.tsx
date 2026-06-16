import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore, ROWS, COLS, calculateColor } from './store';
import { audioEngine } from './AudioEngine';

const CELL_PADDING = 4;
const MIN_CELL_SIZE = 60;
const BORDER_WIDTH = 2;

interface GridCanvasProps {
  onActionComplete?: () => void;
}

interface GridMetrics {
  cellSize: number;
  startX: number;
  startY: number;
  gridWidth: number;
  gridHeight: number;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ onActionComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<'add' | 'remove' | null>(null);
  const [lastFilledCell, setLastFilledCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const dragCellsRef = useRef<Set<string>>(new Set());
  const lastPlayTimeRef = useRef<number>(0);

  const notes = useStore((state) => state.notes);
  const currentPlayingCol = useStore((state) => state.currentPlayingCol);
  const addNote = useStore((state) => state.addNote);
  const removeNote = useStore((state) => state.removeNote);
  const toggleNote = useStore((state) => state.toggleNote);

  const getMetrics = useCallback((): GridMetrics => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return { cellSize: MIN_CELL_SIZE, startX: 10, startY: 10, gridWidth: 500, gridHeight: 200 };
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const borderOffset = BORDER_WIDTH * 2;

    const availableWidth = containerWidth - borderOffset - CELL_PADDING * (COLS + 1);
    const availableHeight = containerHeight - borderOffset - CELL_PADDING * (ROWS + 1);

    const cellWidth = Math.floor(availableWidth / COLS);
    const cellHeight = Math.floor(availableHeight / ROWS);

    const cellSize = Math.max(MIN_CELL_SIZE, Math.min(cellWidth, cellHeight));

    const gridWidth = cellSize * COLS + CELL_PADDING * (COLS + 1);
    const gridHeight = cellSize * ROWS + CELL_PADDING * (ROWS + 1);

    const startX = Math.floor((containerWidth - gridWidth) / 2);
    const startY = Math.floor((containerHeight - gridHeight) / 2);

    return { cellSize, startX, startY, gridWidth, gridHeight };
  }, []);

  const getCellFromPosition = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const metrics = getMetrics();
      const { cellSize, startX, startY } = metrics;

      const col = Math.floor((x - startX - CELL_PADDING) / (cellSize + CELL_PADDING));
      const row = Math.floor((y - startY - CELL_PADDING) / (cellSize + CELL_PADDING));

      const cellX = startX + CELL_PADDING + col * (cellSize + CELL_PADDING);
      const cellY = startY + CELL_PADDING + row * (cellSize + CELL_PADDING);

      if (
        col >= 0 &&
        col < COLS &&
        row >= 0 &&
        row < ROWS &&
        x >= cellX &&
        x < cellX + cellSize &&
        y >= cellY &&
        y < cellY + cellSize
      ) {
        return { row, col };
      }
      return null;
    },
    [getMetrics]
  );

  const noteAt = useCallback(
    (row: number, col: number) => {
      return notes.find((n) => n.row === row && n.col === col);
    },
    [notes]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const metrics = getMetrics();
    const { cellSize, startX, startY, gridWidth, gridHeight } = metrics;

    ctx.save();
    ctx.shadowColor = '#00A8FF';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#00A8FF';
    ctx.lineWidth = BORDER_WIDTH;
    ctx.strokeRect(startX - BORDER_WIDTH, startY - BORDER_WIDTH, gridWidth + BORDER_WIDTH * 2, gridHeight + BORDER_WIDTH * 2);
    ctx.restore();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = startX + CELL_PADDING + col * (cellSize + CELL_PADDING);
        const y = startY + CELL_PADDING + row * (cellSize + CELL_PADDING);
        const note = noteAt(row, col);

        const isPlayingCol = currentPlayingCol === col;
        const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;

        if (note) {
          const colorMatch = note.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
          let fillStyle: CanvasGradient | string = note.color;

          if (colorMatch) {
            const h = parseInt(colorMatch[1]);
            const s = parseInt(colorMatch[2]);
            const l = parseInt(colorMatch[3]);

            const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
            gradient.addColorStop(0, `hsl(${h}, ${s}%, ${Math.min(l + 15, 100)}%)`);
            gradient.addColorStop(0.5, `hsl(${h}, ${s}%, ${l}%)`);
            gradient.addColorStop(1, `hsl(${h}, ${s}%, ${Math.max(l - 15, 0)}%)`);
            fillStyle = gradient;
          }

          ctx.fillStyle = fillStyle;
          ctx.beginPath();
          const radius = 8;
          ctx.roundRect(x, y, cellSize, cellSize, radius);
          ctx.fill();

          if (isPlayingCol) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(x - 2, y - 2, cellSize + 4, cellSize + 4, radius + 2);
            ctx.stroke();
          } else if (isSelected) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(x - 1.5, y - 1.5, cellSize + 3, cellSize + 3, radius + 1);
            ctx.stroke();
          } else {
            ctx.strokeStyle = '#AAAAAA';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, cellSize, cellSize, radius);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = '#2D2D2D';
          ctx.beginPath();
          const radius = 8;
          ctx.roundRect(x, y, cellSize, cellSize, radius);
          ctx.fill();

          if (isPlayingCol) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(x - 2, y - 2, cellSize + 4, cellSize + 4, radius + 2);
            ctx.stroke();
          } else if (isSelected) {
            ctx.strokeStyle = '#00A8FF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(x - 1.5, y - 1.5, cellSize + 3, cellSize + 3, radius + 1);
            ctx.stroke();
          } else {
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, cellSize, cellSize, radius);
            ctx.stroke();
          }
        }
      }
    }
  }, [getMetrics, noteAt, currentPlayingCol, selectedCell]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const handleResize = () => {
      render();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      render();
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  const processCell = useCallback(
    (row: number, col: number) => {
      const key = `${row}-${col}`;
      const now = performance.now();

      if (dragAction === 'add') {
        if (!dragCellsRef.current.has(key)) {
          dragCellsRef.current.add(key);
          if (!noteAt(row, col)) {
            if (now - lastPlayTimeRef.current > 16) {
              addNote(row, col);
              lastPlayTimeRef.current = now;
            } else {
              const freq = audioEngine.getFrequencyForPosition(col, row);
              const type = audioEngine.getOscillatorType(row);
              audioEngine.playNote(freq, type, 0.2);
              const cellNote = notes.find((n) => n.row === row && n.col === col);
              if (!cellNote) {
                useStore.setState((state) => ({
                  notes: [
                    ...state.notes,
                    {
                      id: Math.random().toString(36),
                      row,
                      col,
                      color: calculateColor(col, row),
                      noteType: type,
                      frequency: freq,
                    },
                  ],
                }));
              }
            }
            setLastFilledCell({ row, col });
          }
        }
      } else if (dragAction === 'remove') {
        if (!dragCellsRef.current.has(key)) {
          dragCellsRef.current.add(key);
          if (noteAt(row, col)) {
            removeNote(row, col);
            setLastFilledCell({ row, col });
          }
        }
      }
    },
    [dragAction, noteAt, addNote, removeNote, notes]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const cell = getCellFromPosition(e.clientX, e.clientY);
      if (!cell) return;

      dragCellsRef.current = new Set();
      const existingNote = noteAt(cell.row, cell.col);
      const action = existingNote ? 'remove' : 'add';
      setDragAction(action);
      setIsDragging(true);

      if (action === 'add') {
        addNote(cell.row, cell.col);
      } else {
        removeNote(cell.row, cell.col);
      }
      dragCellsRef.current.add(`${cell.row}-${cell.col}`);
      setLastFilledCell(cell);
      setSelectedCell(cell);
    },
    [getCellFromPosition, noteAt, addNote, removeNote]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !dragAction) return;
      const cell = getCellFromPosition(e.clientX, e.clientY);
      if (cell) {
        processCell(cell.row, cell.col);
      }
    },
    [isDragging, dragAction, getCellFromPosition, processCell]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        setIsDragging(false);
        if (lastFilledCell) {
          setSelectedCell(lastFilledCell);
        }
        setDragAction(null);
        dragCellsRef.current = new Set();
        onActionComplete?.();
      }
    },
    [isDragging, lastFilledCell, onActionComplete]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        setIsDragging(false);
        if (lastFilledCell) {
          setSelectedCell(lastFilledCell);
        }
        setDragAction(null);
        dragCellsRef.current = new Set();
        onActionComplete?.();
      }
    },
    [isDragging, lastFilledCell, onActionComplete]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          display: 'block',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default GridCanvas;
