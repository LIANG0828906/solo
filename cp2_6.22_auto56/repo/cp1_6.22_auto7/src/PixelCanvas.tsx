import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CANVAS_SIZE,
  PIXEL_SIZE,
  getPixelFromEvent,
  getEraserPixels,
  floodFill,
  playInkSound,
  cloneGrid,
  type Tool,
  type Pixel
} from './utils';

interface PixelCanvasProps {
  grid: string[][];
  currentTool: Tool;
  currentColor: string;
  brushSize: number;
  onPixelsChanged: (pixels: Pixel[], newGrid: string[][]) => void;
  onColorPicked: (color: string) => void;
  animatingPixels: Map<string, string>;
  eraserPreview: { x: number; y: number; size: number } | null;
  setEraserPreview: (preview: { x: number; y: number; size: number } | null) => void;
}

const PixelCanvas: React.FC<PixelCanvasProps> = ({
  grid,
  currentTool,
  currentColor,
  brushSize,
  onPixelsChanged,
  onColorPicked,
  animatingPixels,
  eraserPreview,
  setEraserPreview
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const isDrawingRef = useRef(false);
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null);
  const drawnPixelsRef = useRef<Map<string, string>>(new Map());
  const soundThrottleRef = useRef(0);

  const getContainerSize = useCallback(() => {
    if (!containerRef.current) return { width: 640, height: 640 };
    const rect = containerRef.current.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    return { width: size, height: size };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const { width } = getContainerSize();
      const newScale = width / (CANVAS_SIZE * PIXEL_SIZE);
      setScale(Math.max(0.5, newScale));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [getContainerSize]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaledPixel = PIXEL_SIZE * scale;
    const canvasPixelSize = CANVAS_SIZE * scaledPixel;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== canvasPixelSize * dpr || canvas.height !== canvasPixelSize * dpr) {
      canvas.width = canvasPixelSize * dpr;
      canvas.height = canvasPixelSize * dpr;
      canvas.style.width = `${canvasPixelSize}px`;
      canvas.style.height = `${canvasPixelSize}px`;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, canvasPixelSize, canvasPixelSize);

    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const key = `${x},${y}`;
        const animColor = animatingPixels.get(key);
        const color = animColor || grid[y][x];

        ctx.fillStyle = color;
        ctx.fillRect(x * scaledPixel, y * scaledPixel, scaledPixel, scaledPixel);

        if (animColor) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#fff';
          ctx.fillRect(x * scaledPixel, y * scaledPixel, scaledPixel, scaledPixel);
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * scaledPixel, 0);
      ctx.lineTo(i * scaledPixel, canvasPixelSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * scaledPixel);
      ctx.lineTo(canvasPixelSize, i * scaledPixel);
      ctx.stroke();
    }

    if (eraserPreview && currentTool === 'eraser') {
      const half = Math.floor(eraserPreview.size / 2);
      ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
      ctx.strokeStyle = 'rgba(255, 107, 107, 0.8)';
      ctx.lineWidth = 2;
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const x = eraserPreview.x + dx;
          const y = eraserPreview.y + dy;
          if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
            ctx.fillRect(x * scaledPixel, y * scaledPixel, scaledPixel, scaledPixel);
            ctx.strokeRect(x * scaledPixel + 1, y * scaledPixel + 1, scaledPixel - 2, scaledPixel - 2);
          }
        }
      }
    }
  }, [grid, scale, animatingPixels, eraserPreview, currentTool]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  const applyPixels = useCallback((pixels: Pixel[]) => {
    if (pixels.length === 0) return;
    const newGrid = cloneGrid(grid);
    pixels.forEach(p => {
      if (p.y >= 0 && p.y < CANVAS_SIZE && p.x >= 0 && p.x < CANVAS_SIZE) {
        newGrid[p.y][p.x] = p.color;
      }
    });
    onPixelsChanged(pixels, newGrid);
  }, [grid, onPixelsChanged]);

  const playSoundThrottled = useCallback(() => {
    const now = performance.now();
    if (now - soundThrottleRef.current > 30) {
      playInkSound();
      soundThrottleRef.current = now;
    }
  }, []);

  const getPixelAt = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return getPixelFromEvent(e.clientX, e.clientY, rect, scale);
  }, [scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getPixelAt(e);
    if (!pos) return;

    if (currentTool === 'eyedropper') {
      const color = grid[pos.y][pos.x];
      onColorPicked(color);
      return;
    }

    if (currentTool === 'fill') {
      const { pixels, newGrid } = floodFill(grid, pos.x, pos.y, currentColor);
      if (pixels.length > 0) {
        playInkSound();
        onPixelsChanged(pixels, newGrid);
      }
      return;
    }

    isDrawingRef.current = true;
    drawnPixelsRef.current = new Map();

    if (currentTool === 'pencil') {
      const key = `${pos.x},${pos.y}`;
      if (grid[pos.y][pos.x] !== currentColor) {
        drawnPixelsRef.current.set(key, currentColor);
        applyPixels([{ x: pos.x, y: pos.y, color: currentColor }]);
        playSoundThrottled();
      }
    } else if (currentTool === 'eraser') {
      const eraserPixels = getEraserPixels(pos.x, pos.y, brushSize);
      const filtered = eraserPixels.filter(p => grid[p.y][p.x] !== '#ffffff');
      filtered.forEach(p => drawnPixelsRef.current.set(`${p.x},${p.y}`, '#ffffff'));
      if (filtered.length > 0) {
        applyPixels(filtered);
        playSoundThrottled();
      }
    }

    lastPixelRef.current = pos;
  }, [currentTool, currentColor, brushSize, grid, getPixelAt, applyPixels, onColorPicked, onPixelsChanged, playSoundThrottled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getPixelAt(e);

    if (currentTool === 'eraser') {
      if (pos) {
        setEraserPreview({ x: pos.x, y: pos.y, size: brushSize });
      } else {
        setEraserPreview(null);
      }
    }

    if (!isDrawingRef.current || !pos) return;

    if (currentTool === 'pencil') {
      const last = lastPixelRef.current;
      if (last && (last.x !== pos.x || last.y !== pos.y)) {
        const dx = Math.abs(pos.x - last.x);
        const dy = Math.abs(pos.y - last.y);
        const steps = Math.max(dx, dy);

        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const x = Math.round(last.x + (pos.x - last.x) * t);
          const y = Math.round(last.y + (pos.y - last.y) * t);
          const key = `${x},${y}`;

          if (!drawnPixelsRef.current.has(key) && grid[y][x] !== currentColor) {
            drawnPixelsRef.current.set(key, currentColor);
            applyPixels([{ x, y, color: currentColor }]);
            playSoundThrottled();
          }
        }
      } else if (!last) {
        const key = `${pos.x},${pos.y}`;
        if (!drawnPixelsRef.current.has(key) && grid[pos.y][pos.x] !== currentColor) {
          drawnPixelsRef.current.set(key, currentColor);
          applyPixels([{ x: pos.x, y: pos.y, color: currentColor }]);
          playSoundThrottled();
        }
      }
    } else if (currentTool === 'eraser') {
      const eraserPixels = getEraserPixels(pos.x, pos.y, brushSize);
      const toErase: Pixel[] = [];
      eraserPixels.forEach(p => {
        const key = `${p.x},${p.y}`;
        if (!drawnPixelsRef.current.has(key) && grid[p.y][p.x] !== '#ffffff') {
          drawnPixelsRef.current.set(key, '#ffffff');
          toErase.push(p);
        }
      });
      if (toErase.length > 0) {
        applyPixels(toErase);
        playSoundThrottled();
      }
    }

    lastPixelRef.current = pos;
  }, [currentTool, currentColor, brushSize, grid, getPixelAt, applyPixels, setEraserPreview, playSoundThrottled]);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPixelRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDrawingRef.current = false;
    lastPixelRef.current = null;
    setEraserPreview(null);
  }, [setEraserPreview]);

  const cursorStyle: React.CSSProperties = {
    cursor: currentTool === 'eyedropper' ? 'copy' : 'crosshair'
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        minWidth: 0,
        minHeight: 0
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          ...cursorStyle,
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backgroundColor: '#fff',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
};

export default PixelCanvas;
