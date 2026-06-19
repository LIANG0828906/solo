import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from './store';
import { PALETTE, GRID_SIZE, PIXEL_SIZE } from './utils/palette';
import { drawFrameToCanvas } from './utils/frame';
import type { PixelColor } from './types';

const CANVAS_SIZE = GRID_SIZE * PIXEL_SIZE;
const MAG_SIZE = 120;
const MAG_REGION = 6;

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const magCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const frames = useAppStore((s) => s.frames);
  const currentFrameId = useAppStore((s) => s.currentFrameId);
  const currentColor = useAppStore((s) => s.currentColor);
  const setCurrentColor = useAppStore((s) => s.setCurrentColor);
  const updatePixel = useAppStore((s) => s.updatePixel);
  const incrementEditCount = useAppStore((s) => s.incrementEditCount);
  const localUser = useAppStore((s) => s.localUser);
  const setFrameEditor = useAppStore((s) => s.setFrameEditor);

  const isDrawingRef = useRef(false);
  const isErasingRef = useRef(false);
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showMagnifier, setShowMagnifier] = useState(false);

  const currentFrame = frames.find((f) => f.id === currentFrameId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFrameToCanvas(ctx, currentFrame.data, CANVAS_SIZE, PIXEL_SIZE);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SIZE, 0);
      ctx.lineTo(i * PIXEL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * PIXEL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * PIXEL_SIZE);
      ctx.stroke();
    }
  }, [currentFrame]);

  useEffect(() => {
    const magCanvas = magCanvasRef.current;
    if (!magCanvas || !currentFrame || !mousePos) return;
    const ctx = magCanvas.getContext('2d');
    if (!ctx) return;

    const magPixelSize = MAG_SIZE / (MAG_REGION * 2);
    ctx.clearRect(0, 0, MAG_SIZE, MAG_SIZE);

    for (let dy = -MAG_REGION; dy < MAG_REGION; dy++) {
      for (let dx = -MAG_REGION; dx < MAG_REGION; dx++) {
        const px = mousePos.x + dx;
        const py = mousePos.y + dy;
        let color: PixelColor = null;
        if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
          color = currentFrame.data[py][px];
        }
        const drawX = (dx + MAG_REGION) * magPixelSize;
        const drawY = (dy + MAG_REGION) * magPixelSize;
        if (color) {
          ctx.fillStyle = color;
        } else {
          const isEven = (dx + dy) % 2 === 0;
          ctx.fillStyle = isEven ? '#3A3A5C' : '#2D2D44';
        }
        ctx.fillRect(drawX, drawY, magPixelSize, magPixelSize);
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      (MAG_REGION - 0.5) * magPixelSize,
      (MAG_REGION - 0.5) * magPixelSize,
      magPixelSize,
      magPixelSize
    );
  }, [mousePos, currentFrame]);

  const getPixelFromEvent = useCallback(
    (e: React.MouseEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((e.clientX - rect.left) * scaleX) / PIXEL_SIZE);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / PIXEL_SIZE);
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
      return { x, y };
    },
    []
  );

  const applyPixel = useCallback(
    (x: number, y: number, color: PixelColor) => {
      const last = lastPixelRef.current;
      if (last && last.x === x && last.y === y) return;
      lastPixelRef.current = { x, y };
      updatePixel(currentFrameId, x, y, color);
      incrementEditCount();

      if (window.socketEmitPixelUpdate) {
        window.socketEmitPixelUpdate(currentFrameId, x, y, color);
      }
    },
    [currentFrameId, updatePixel, incrementEditCount]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (localUser) {
        setFrameEditor(currentFrameId, localUser.id);
        if (window.socketEmitFrameLock) {
          window.socketEmitFrameLock(currentFrameId, localUser.id);
        }
      }

      if (e.button === 2) {
        isErasingRef.current = true;
      } else {
        isDrawingRef.current = true;
      }
      const pos = getPixelFromEvent(e);
      if (pos) {
        const color = isErasingRef.current ? null : currentColor;
        applyPixel(pos.x, pos.y, color);
      }
    },
    [localUser, currentFrameId, currentColor, getPixelFromEvent, applyPixel, setFrameEditor]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getPixelFromEvent(e);
      if (pos) {
        setMousePos(pos);
        setShowMagnifier(true);
      } else {
        setShowMagnifier(false);
      }

      if ((isDrawingRef.current || isErasingRef.current) && pos) {
        const color = isErasingRef.current ? null : currentColor;
        applyPixel(pos.x, pos.y, color);
      }
    },
    [currentColor, getPixelFromEvent, applyPixel]
  );

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    isErasingRef.current = false;
    lastPixelRef.current = null;
    if (localUser) {
      setFrameEditor(currentFrameId, undefined);
      if (window.socketEmitFrameLock) {
        window.socketEmitFrameLock(currentFrameId, undefined);
      }
    }
  }, [localUser, currentFrameId, setFrameEditor]);

  const handleMouseLeave = useCallback(() => {
    setShowMagnifier(false);
    handleMouseUp();
  }, [handleMouseUp]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="editor-area">
      <div className="palette-panel">
        <div className="palette-title">调色板</div>
        <div className="palette-grid">
          {PALETTE.map((color, idx) => (
            <div
              key={idx}
              className={`palette-color ${color === null ? 'transparent' : ''} ${
                currentColor === color ? 'active' : ''
              }`}
              style={{ background: color ?? undefined }}
              onClick={() => setCurrentColor(color)}
              title={color === null ? '透明/橡皮擦' : color}
            />
          ))}
        </div>
      </div>

      <div className="canvas-wrapper" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="main-canvas"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
        />
        <div className={`magnifier ${showMagnifier ? 'visible' : ''}`}>
          <canvas ref={magCanvasRef} className="magnifier-canvas" width={MAG_SIZE} height={MAG_SIZE} />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
