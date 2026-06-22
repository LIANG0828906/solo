import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { undoManager } from '../utils/undoManager';
import { socketClient } from '../utils/socketClient';

const BASE_PIXEL_SIZE = 16;
const GRID_SIZE = 32;

export function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(
    null
  );
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number } | null>(null);
  const [, forceRender] = useState(0);

  const {
    pixels,
    brushColor,
    toolMode,
    zoom,
    canvasOffset,
    setPixel,
    setBulkPixels,
    setPixels,
    setBrushColor,
    setToolMode,
    setCanvasOffset,
    isPlaying,
    playFrameIndex,
    frames,
  } = useEditorStore();

  const pixelSize = BASE_PIXEL_SIZE * zoom;
  const canvasSize = GRID_SIZE * pixelSize;

  const getDisplayPixels = useCallback(() => {
    if (isPlaying && frames.length > 0) {
      return frames[playFrameIndex % frames.length]?.pixels || pixels;
    }
    return pixels;
  }, [isPlaying, playFrameIndex, frames, pixels]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayPixels = getDisplayPixels();

    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = displayPixels[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * pixelSize, 0);
      ctx.lineTo(i * pixelSize, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * pixelSize);
      ctx.lineTo(canvasSize, i * pixelSize);
      ctx.stroke();
    }

    if (hoverPixel && !isPlaying) {
      ctx.strokeStyle = 'rgba(0, 191, 165, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        hoverPixel.x * pixelSize + 0.5,
        hoverPixel.y * pixelSize + 0.5,
        pixelSize - 1,
        pixelSize - 1
      );

      ctx.strokeStyle = 'rgba(0, 191, 165, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoverPixel.x * pixelSize + pixelSize / 2, 0);
      ctx.lineTo(hoverPixel.x * pixelSize + pixelSize / 2, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, hoverPixel.y * pixelSize + pixelSize / 2);
      ctx.lineTo(canvasSize, hoverPixel.y * pixelSize + pixelSize / 2);
      ctx.stroke();
    }
  }, [canvasSize, pixelSize, hoverPixel, getDisplayPixels, isPlaying]);

  useEffect(() => {
    render();
  }, [render, pixels, isPlaying, playFrameIndex, frames]);

  const getPixelCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
    return { x, y };
  };

  const floodFill = (
    startX: number,
    startY: number,
    targetColor: string | null,
    replaceColor: string | null
  ) => {
    const currentPixels = getDisplayPixels();
    if (targetColor === replaceColor) return;

    const stack: [number, number][] = [[startX, startY]];
    const changes: { x: number; y: number; color: string | null }[] = [];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue;
      if (currentPixels[cy][cx] !== targetColor) continue;
      changes.push({ x: cx, y: cy, color: replaceColor });
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    if (changes.length > 0) {
      undoManager.push(currentPixels);
      setBulkPixels(changes);
      socketClient.fillArea(startX, startY, targetColor, replaceColor);
    }
  };

  const handleAction = (coords: { x: number; y: number }) => {
    if (isPlaying) return;
    const { x, y } = coords;
    const currentPixels = getDisplayPixels();

    if (toolMode === 'pencil') {
      if (
        lastPixelRef.current &&
        lastPixelRef.current.x === x &&
        lastPixelRef.current.y === y
      ) {
        return;
      }
      const targetColor = currentPixels[y]?.[x];
      if (targetColor === brushColor) {
        lastPixelRef.current = { x, y };
        return;
      }
      if (!lastPixelRef.current) {
        undoManager.push(currentPixels);
      }
      setPixel(x, y, brushColor);
      socketClient.drawPixel(x, y, brushColor);
      lastPixelRef.current = { x, y };
    } else if (toolMode === 'fill') {
      const targetColor = currentPixels[y]?.[x] ?? null;
      floodFill(x, y, targetColor, brushColor);
    } else if (toolMode === 'picker') {
      const color = currentPixels[y]?.[x];
      if (color) {
        setBrushColor(color);
      }
    } else if (toolMode === 'move') {
      // move handled in mouse events
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlaying) return;

    if (toolMode === 'move') {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: canvasOffset.x,
        offsetY: canvasOffset.y,
      };
      setToolMode('move');
      return;
    }

    isDrawingRef.current = true;
    lastPixelRef.current = null;
    const coords = getPixelCoords(e);
    if (coords) {
      handleAction(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current && dragStartRef.current && toolMode === 'move') {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setCanvasOffset({
        x: dragStartRef.current.offsetX + dx,
        y: dragStartRef.current.offsetY + dy,
      });
      return;
    }

    const coords = getPixelCoords(e);
    setHoverPixel(coords);

    if (isDrawingRef.current && coords && !isPlaying) {
      if (toolMode === 'pencil') {
        handleAction(coords);
      }
    }
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    isDraggingRef.current = false;
    dragStartRef.current = null;
    lastPixelRef.current = null;
    forceRender((v) => v + 1);
  };

  const handleMouseLeave = () => {
    setHoverPixel(null);
    isDrawingRef.current = false;
    isDraggingRef.current = false;
    dragStartRef.current = null;
    lastPixelRef.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPlaying) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const result = undoManager.undo(getDisplayPixels());
        if (result) {
          setPixels(result);
          socketClient.setPixels(result);
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        const result = undoManager.redo(getDisplayPixels());
        if (result) {
          setPixels(result);
          socketClient.setPixels(result);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getDisplayPixels, setPixels, isPlaying]);

  useEffect(() => {
    const un1 = socketClient.on('pixel_draw', (data: unknown) => {
      const d = data as { x: number; y: number; color: string | null };
      setPixel(d.x, d.y, d.color);
    });
    const un2 = socketClient.on('bulk_pixels', (data: unknown) => {
      const d = data as { x: number; y: number; color: string | null }[];
      setBulkPixels(d);
    });
    const un3 = socketClient.on('set_pixels', (data: unknown) => {
      const d = data as (string | null)[][];
      undoManager.push(getDisplayPixels());
      setPixels(d);
    });
    const un4 = socketClient.on('undo', () => {
      const result = undoManager.undo(getDisplayPixels());
      if (result) {
        setPixels(result);
      }
    });
    const un5 = socketClient.on('redo', () => {
      const result = undoManager.redo(getDisplayPixels());
      if (result) {
        setPixels(result);
      }
    });
    return () => {
      un1();
      un2();
      un3();
      un4();
      un5();
    };
  }, [setPixel, setBulkPixels, setPixels, getDisplayPixels]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        background: '#1A1A1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        minWidth: 640,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          gap: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => useEditorStore.getState().setZoom(zoom - 0.5)}
          disabled={zoom <= 1}
          style={{
            width: 32,
            height: 32,
            background: '#2C2C2C',
            border: '1px solid #555555',
            borderRadius: 4,
            color: '#E0E0E0',
            cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          −
        </button>
        <div
          style={{
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            background: '#2C2C2C',
            border: '1px solid #555555',
            borderRadius: 4,
            color: '#E0E0E0',
            fontSize: 13,
          }}
        >
          {zoom.toFixed(1)}x
        </div>
        <button
          onClick={() => useEditorStore.getState().setZoom(zoom + 0.5)}
          disabled={zoom >= 4}
          style={{
            width: 32,
            height: 32,
            background: '#2C2C2C',
            border: '1px solid #555555',
            borderRadius: 4,
            color: '#E0E0E0',
            cursor: zoom >= 4 ? 'not-allowed' : 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          padding: '2px',
          background: '#555555',
          borderRadius: 2,
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            display: 'block',
            cursor:
              toolMode === 'pencil'
                ? 'crosshair'
                : toolMode === 'fill'
                ? 'cell'
                : toolMode === 'picker'
                ? 'copy'
                : toolMode === 'move'
                ? isDraggingRef.current
                  ? 'grabbing'
                  : 'grab'
                : 'default',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}
