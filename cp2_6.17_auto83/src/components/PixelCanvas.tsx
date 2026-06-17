import React, { useRef, useEffect, useState } from 'react';
import { usePixelStore } from '../pixelBoard/store';
import { PixelRenderer } from '../pixelBoard/renderer';
import { PIXEL_SIZE, GRID_SIZE } from '../pixelBoard/types';
import { collaborationChannel } from '../collaboration/channel';
import { v4 as uuidv4 } from 'uuid';
import type { Pixel } from '../pixelBoard/types';

interface PixelCanvasProps {
  onPixelAdd?: (pixel: Pixel) => void;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({ onPixelAdd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PixelRenderer | null>(null);
  const { pixels, currentColor, userId, addPixel } = usePixelStore();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new PixelRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.renderAll(pixels);

    collaborationChannel.setOnRemotePixelAdded((pixel) => {
      if (rendererRef.current) {
        rendererRef.current.addCursorAnimation(pixel.id, pixel.x, pixel.y);
      }
    });

    return () => {
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / PIXEL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / PIXEL_SIZE);

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

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
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="pixel-canvas"
        onClick={handleCanvasClick}
      />
    </div>
  );
};
