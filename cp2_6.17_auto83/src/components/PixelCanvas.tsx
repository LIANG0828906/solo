import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePixelStore } from '../pixelBoard/store';
import { PixelRenderer } from '../pixelBoard/renderer';
import { PIXEL_SIZE, GRID_SIZE, CANVAS_SIZE } from '../pixelBoard/types';
import { collaborationChannel } from '../collaboration/channel';
import { v4 as uuidv4 } from 'uuid';
import type { Pixel } from '../pixelBoard/types';

interface PixelCanvasProps {
  onPixelAdd?: (pixel: Pixel) => void;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({ onPixelAdd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PixelRenderer | null>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pixels, currentColor, userId, addPixel } = usePixelStore();
  const [, forceUpdate] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastDrawRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !overlayRef.current) return;

    const renderer = new PixelRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.renderAll(pixels);

    const resizeOverlay = () => {
      if (overlayRef.current && canvasRef.current) {
        overlayRef.current.width = canvasRef.current.width;
        overlayRef.current.height = canvasRef.current.height;
      }
    };
    resizeOverlay();
    window.addEventListener('resize', resizeOverlay);

    collaborationChannel.setOnRemotePixelAdded((pixel) => {
      if (rendererRef.current) {
        rendererRef.current.addCursorAnimation(pixel.id, pixel.x, pixel.y);
      }
    });

    return () => {
      window.removeEventListener('resize', resizeOverlay);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.renderAll(pixels);
      forceUpdate((n) => n + 1);
    }
  }, [pixels]);

  const getPixelCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / PIXEL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / PIXEL_SIZE);

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
    return { x, y };
  }, []);

  const drawPixel = useCallback((x: number, y: number) => {
    const pixel: Pixel = {
      id: uuidv4(),
      x,
      y,
      color: currentColor,
      timestamp: Date.now(),
      ownerId: userId,
    };

    addPixel(pixel);
    collaborationChannel.sendPixel(pixel);

    if (onPixelAdd) {
      onPixelAdd(pixel);
    }
  }, [addPixel, collaborationChannel, currentColor, onPixelAdd, userId]);

  const renderOverlay = useCallback((coords: { x: number; y: number } | null, drawing: boolean) => {
    if (!overlayRef.current) return;

    const ctx = overlayRef.current.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

    if (!coords) {
      ctx.restore();
      return;
    }

    const x = coords.x * PIXEL_SIZE + 1;
    const y = coords.y * PIXEL_SIZE + 1;
    const size = PIXEL_SIZE - 2;

    if (drawing) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(currentColor);
      let r = 0, g = 0, b = 0;
      if (result) {
        r = parseInt(result[1], 16);
        g = parseInt(result[2], 16);
        b = parseInt(result[3], 16);
      }
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
      ctx.fillRect(x, y, size, size);
    } else {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
      ctx.setLineDash([]);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, [currentColor]);

  const clearOverlay = useCallback(() => {
    if (!overlayRef.current) return;
    const ctx = overlayRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
  }, []);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);

    if (isDrawing && coords) {
      if (!lastDrawRef.current || lastDrawRef.current.x !== coords.x || lastDrawRef.current.y !== coords.y) {
        drawPixel(coords.x, coords.y);
        lastDrawRef.current = { x: coords.x, y: coords.y };
      }
    }

    renderOverlay(coords, isDrawing);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (coords) {
      setIsDrawing(true);
      lastDrawRef.current = { x: coords.x, y: coords.y };
      drawPixel(coords.x, coords.y);
      renderOverlay(coords, true);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastDrawRef.current = null;
    const coords = getPixelCoords(e);
    if (coords) {
      renderOverlay(coords, false);
    }
  };

  const handleCanvasMouseLeave = () => {
    setIsDrawing(false);
    lastDrawRef.current = null;
    clearOverlay();
  };

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="pixel-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
      />
      <canvas
        ref={overlayRef}
        className="pixel-canvas-overlay"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
};
