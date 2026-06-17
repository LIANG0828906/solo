import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePixelStore } from '../pixelBoard/store';
import { PixelRenderer } from '../pixelBoard/renderer';
import { PIXEL_SIZE, GRID_SIZE } from '../pixelBoard/types';
import { collaborationChannel } from '../collaboration/channel';
import { v4 as uuidv4 } from 'uuid';
import type { Pixel } from '../pixelBoard/types';

const PRESET_COLORS: string[] = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00',
  '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FF8000', '#8000FF', '#0080FF', '#00FF80',
  '#808080', '#C0C0C0', '#800000', '#008080',
];

interface PixelCanvasProps {
  onPixelAdd?: (pixel: Pixel) => void;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({ onPixelAdd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PixelRenderer | null>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const { pixels, currentColor, userId, addPixel, setCurrentColor } = usePixelStore();
  const [, forceUpdate] = useState(0);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor);

  useEffect(() => {
    if (!canvasRef.current || !overlayRef.current) return;

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

  useEffect(() => {
    setCustomColor(currentColor);
  }, [currentColor]);

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

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    setHoverPos(coords);

    if (isDrawing && coords) {
      drawPixel(coords.x, coords.y);
    }

    renderOverlay(coords, isDrawing);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (coords) {
      setIsDrawing(true);
      drawPixel(coords.x, coords.y);
      renderOverlay(coords, true);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    if (hoverPos) {
      renderOverlay(hoverPos, false);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoverPos(null);
    setIsDrawing(false);
    clearOverlay();
  };

  const renderOverlay = (coords: { x: number; y: number } | null, drawing: boolean) => {
    if (!overlayRef.current) return;

    const ctx = overlayRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

    if (!coords) return;

    const x = coords.x * PIXEL_SIZE + 1;
    const y = coords.y * PIXEL_SIZE + 1;
    const size = PIXEL_SIZE - 2;

    if (drawing) {
      ctx.fillStyle = hexToRgba(currentColor, 0.5);
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
  };

  const clearOverlay = () => {
    if (!overlayRef.current) return;
    const ctx = overlayRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(0, 0, 0, ${alpha})`;
  };

  const handlePresetColorClick = (color: string) => {
    setCurrentColor(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
  };

  const handleCustomColorApply = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      setCurrentColor(customColor);
    }
  };

  const handleCustomColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCustomColorApply();
    }
  };

  return (
    <div className="pixel-canvas-wrapper">
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="pixel-canvas"
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
        />
        <canvas
          ref={overlayRef}
          className="pixel-canvas-overlay"
          width={640}
          height={640}
          style={{ pointerEvents: 'none' }}
        />
      </div>

      <div className="canvas-color-panel">
        <div className="color-panel-title">调色板</div>
        
        <div className="preset-colors">
          {PRESET_COLORS.map((color, index) => (
            <button
              key={index}
              className={`preset-color-swatch ${currentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handlePresetColorClick(color)}
              title={color}
            />
          ))}
        </div>

        <div className="custom-color-section">
          <div className="custom-color-label">自定义颜色</div>
          <div className="custom-color-input-wrapper">
            <input
              type="text"
              className="custom-color-input"
              value={customColor}
              onChange={handleCustomColorChange}
              onKeyDown={handleCustomColorKeyDown}
              onBlur={handleCustomColorApply}
              placeholder="#FFFFFF"
              maxLength={7}
            />
            <div
              className="custom-color-preview"
              style={{ backgroundColor: customColor }}
            />
          </div>
          <div className="color-picker-native">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value);
                setCustomColor(e.target.value);
              }}
              className="color-picker-input"
            />
            <span className="color-picker-label">选择器</span>
          </div>
        </div>
      </div>
    </div>
  );
};
