import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore, ROWS, COLS, calculateColor } from './store';
import { audioEngine } from './AudioEngine';

const CELL_PADDING = 4;
const MIN_CELL_SIZE = 60;
const BORDER_WIDTH = 2;
const DRAG_THROTTLE_MS = 50;
const PLAYING_FPS_TARGET = 45;
const IDLE_FPS_TARGET = 55;

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

interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ onActionComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<'add' | 'remove' | null>(null);
  const [lastFilledCell, setLastFilledCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [, forceUpdate] = useState(0);

  const dragCellsRef = useRef<Set<string>>(new Set());
  const lastDragProcessTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsFrameCountRef = useRef<number>(0);
  const fpsLastUpdateRef = useRef<number>(0);
  const currentFpsRef = useRef<number>(60);
  const previousNotesRef = useRef<string | null>(null);
  const previousPlayingColRef = useRef<number | null>(null);
  const previousSelectedRef = useRef<string | null>(null);
  const dirtyCellsRef = useRef<Set<string>>(new Set());
  const isPlayingRef = useRef(false);
  const lastMouseMoveTimeRef = useRef<number>(0);

  const notes = useStore((state) => state.notes);
  const currentPlayingCol = useStore((state) => state.currentPlayingCol);
  const isPlaying = useStore((state) => state.isPlaying);
  const addNote = useStore((state) => state.addNote);
  const removeNote = useStore((state) => state.removeNote);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const markCellDirty = useCallback((row: number, col: number) => {
    dirtyCellsRef.current.add(`${row}-${col}`);
  }, []);

  const markAllCellsDirty = useCallback(() => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        dirtyCellsRef.current.add(`${r}-${c}`);
      }
    }
  }, []);

  const checkDirty = useCallback(() => {
    const notesKey = JSON.stringify(notes);
    if (notesKey !== previousNotesRef.current) {
      const prevNotes = previousNotesRef.current ? JSON.parse(previousNotesRef.current) : [];
      const currentNotesMap = new Map(notes.map((n) => [`${n.row}-${n.col}`, n]));
      const prevNotesMap = new Map(prevNotes.map((n: any) => [`${n.row}-${n.col}`, n]));

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const key = `${r}-${c}`;
          const hasCurrent = currentNotesMap.has(key);
          const hasPrev = prevNotesMap.has(key);
          if (hasCurrent !== hasPrev) {
            markCellDirty(r, c);
          }
        }
      }

      previousNotesRef.current = notesKey;
    }

    if (currentPlayingCol !== previousPlayingColRef.current) {
      if (previousPlayingColRef.current !== null) {
        for (let r = 0; r < ROWS; r++) {
          markCellDirty(r, previousPlayingColRef.current);
        }
      }
      if (currentPlayingCol !== null) {
        for (let r = 0; r < ROWS; r++) {
          markCellDirty(r, currentPlayingCol);
        }
      }
      previousPlayingColRef.current = currentPlayingCol;
    }

    const selectedKey = selectedCell ? `${selectedCell.row}-${selectedCell.col}` : null;
    if (selectedKey !== previousSelectedRef.current) {
      if (previousSelectedRef.current) {
        const [r, c] = previousSelectedRef.current.split('-').map(Number);
        markCellDirty(r, c);
      }
      if (selectedKey) {
        const [r, c] = selectedKey.split('-').map(Number);
        markCellDirty(r, c);
      }
      previousSelectedRef.current = selectedKey;
    }
  }, [notes, currentPlayingCol, selectedCell, markCellDirty]);

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

  const getCellRect = useCallback(
    (row: number, col: number, metrics: GridMetrics): CellRect => {
      const { cellSize, startX, startY } = metrics;
      const x = startX + CELL_PADDING + col * (cellSize + CELL_PADDING);
      const y = startY + CELL_PADDING + row * (cellSize + CELL_PADDING);
      return { x, y, width: cellSize, height: cellSize };
    },
    []
  );

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

      const cellRect = getCellRect(row, col, metrics);

      if (
        col >= 0 &&
        col < COLS &&
        row >= 0 &&
        row < ROWS &&
        x >= cellRect.x &&
        x < cellRect.x + cellRect.width &&
        y >= cellRect.y &&
        y < cellRect.y + cellRect.height
      ) {
        return { row, col };
      }
      return null;
    },
    [getMetrics, getCellRect]
  );

  const noteAt = useCallback(
    (row: number, col: number) => {
      return notes.find((n) => n.row === row && n.col === col);
    },
    [notes]
  );

  const drawCell = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      row: number,
      col: number,
      metrics: GridMetrics
    ) => {
      const { cellSize } = metrics;
      const cellRect = getCellRect(row, col, metrics);
      const note = noteAt(row, col);

      const isPlayingCol = currentPlayingCol === col;
      const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
      const radius = 8;

      ctx.clearRect(
        cellRect.x - 5,
        cellRect.y - 5,
        cellRect.width + 10,
        cellRect.height + 10
      );

      if (note) {
        const colorMatch = note.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        let fillStyle: CanvasGradient | string = note.color;

        if (colorMatch) {
          const h = parseInt(colorMatch[1]);
          const s = parseInt(colorMatch[2]);
          const l = parseInt(colorMatch[3]);

          const gradient = ctx.createLinearGradient(
            cellRect.x,
            cellRect.y,
            cellRect.x + cellSize,
            cellRect.y + cellSize
          );
          gradient.addColorStop(0, `hsl(${h}, ${s}%, ${Math.min(l + 15, 100)}%)`);
          gradient.addColorStop(0.5, `hsl(${h}, ${s}%, ${l}%)`);
          gradient.addColorStop(1, `hsl(${h}, ${s}%, ${Math.max(l - 15, 0)}%)`);
          fillStyle = gradient;
        }

        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.roundRect(cellRect.x, cellRect.y, cellSize, cellSize, radius);
        ctx.fill();

        if (isPlayingCol) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(
            cellRect.x - 2,
            cellRect.y - 2,
            cellSize + 4,
            cellSize + 4,
            radius + 2
          );
          ctx.stroke();
        } else if (isSelected) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(
            cellRect.x - 1.5,
            cellRect.y - 1.5,
            cellSize + 3,
            cellSize + 3,
            radius + 1
          );
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#AAAAAA';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(cellRect.x, cellRect.y, cellSize, cellSize, radius);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#2D2D2D';
        ctx.beginPath();
        ctx.roundRect(cellRect.x, cellRect.y, cellSize, cellSize, radius);
        ctx.fill();

        if (isPlayingCol) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(
            cellRect.x - 2,
            cellRect.y - 2,
            cellSize + 4,
            cellSize + 4,
            radius + 2
          );
          ctx.stroke();
        } else if (isSelected) {
          ctx.strokeStyle = '#00A8FF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(
            cellRect.x - 1.5,
            cellRect.y - 1.5,
            cellSize + 3,
            cellSize + 3,
            radius + 1
          );
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#555555';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(cellRect.x, cellRect.y, cellSize, cellSize, radius);
          ctx.stroke();
        }
      }
    },
    [getCellRect, noteAt, currentPlayingCol, selectedCell]
  );

  const drawBorder = useCallback(
    (ctx: CanvasRenderingContext2D, metrics: GridMetrics) => {
      const { startX, startY, gridWidth, gridHeight } = metrics;

      ctx.save();
      ctx.shadowColor = '#00A8FF';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#00A8FF';
      ctx.lineWidth = BORDER_WIDTH;
      ctx.strokeRect(
        startX - BORDER_WIDTH,
        startY - BORDER_WIDTH,
        gridWidth + BORDER_WIDTH * 2,
        gridHeight + BORDER_WIDTH * 2
      );
      ctx.restore();
    },
    []
  );

  const render = useCallback(
    (forceFull: boolean = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      const canvasWidth = rect.width * dpr;
      const canvasHeight = rect.height * dpr;
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        forceFull = true;
      }

      const metrics = getMetrics();

      if (forceFull) {
        ctx.clearRect(0, 0, rect.width, rect.height);
        drawBorder(ctx, metrics);
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            drawCell(ctx, row, col, metrics);
          }
        }
        dirtyCellsRef.current.clear();
      } else {
        if (dirtyCellsRef.current.size > 0) {
          dirtyCellsRef.current.forEach((key) => {
            const [row, col] = key.split('-').map(Number);
            drawCell(ctx, row, col, metrics);
          });
          dirtyCellsRef.current.clear();
        }
      }
    },
    [getMetrics, drawBorder, drawCell]
  );

  useEffect(() => {
    checkDirty();
  }, [checkDirty]);

  useEffect(() => {
    const updateFPS = (now: number) => {
      fpsFrameCountRef.current++;
      if (now - fpsLastUpdateRef.current >= 1000) {
        currentFpsRef.current = fpsFrameCountRef.current;
        fpsFrameCountRef.current = 0;
        fpsLastUpdateRef.current = now;
      }
    };

    const animationLoop = (now: number) => {
      const targetFPS = isPlayingRef.current ? PLAYING_FPS_TARGET : IDLE_FPS_TARGET;
      const frameInterval = 1000 / targetFPS;
      const delta = now - lastFrameTimeRef.current;

      if (delta >= frameInterval) {
        lastFrameTimeRef.current = now - (delta % frameInterval);
        updateFPS(now);
        render(false);
      }

      animationFrameIdRef.current = requestAnimationFrame(animationLoop);
    };

    render(true);
    markAllCellsDirty();

    animationFrameIdRef.current = requestAnimationFrame(animationLoop);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [render, markAllCellsDirty]);

  useEffect(() => {
    const handleResize = () => {
      render(true);
      markAllCellsDirty();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render, markAllCellsDirty]);

  const processCell = useCallback(
    (row: number, col: number) => {
      const key = `${row}-${col}`;

      if (dragAction === 'add') {
        if (!dragCellsRef.current.has(key)) {
          dragCellsRef.current.add(key);
          if (!noteAt(row, col)) {
            addNote(row, col);
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
    [dragAction, noteAt, addNote, removeNote]
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
      lastDragProcessTimeRef.current = performance.now();

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

      const now = performance.now();
      if (now - lastDragProcessTimeRef.current < DRAG_THROTTLE_MS) {
        return;
      }

      lastMouseMoveTimeRef.current = now;
      const cell = getCellFromPosition(e.clientX, e.clientY);
      if (cell) {
        processCell(cell.row, cell.col);
        lastDragProcessTimeRef.current = now;
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
