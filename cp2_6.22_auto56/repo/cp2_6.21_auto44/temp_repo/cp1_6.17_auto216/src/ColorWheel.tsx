import React, { useRef, useEffect, useState, useCallback } from 'react';
import { hsvToRgb, rgbToHex } from './utils/colorUtils';

interface ColorWheelProps {
  onColorSelect: (color: string) => void;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ onColorSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brightnessRef = useRef<HTMLCanvasElement>(null);
  const [hue, setHue] = useState(240);
  const [saturation, setSaturation] = useState(0.7);
  const [value, setValue] = useState(0.95);
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);
  const [isDraggingBrightness, setIsDraggingBrightness] = useState(false);
  const wheelSize = 200;
  const brightnessWidth = 200;
  const brightnessHeight = 20;

  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = wheelSize / 2;
    const image = ctx.createImageData(wheelSize, wheelSize);
    const data = image.data;

    for (let y = 0; y < wheelSize; y++) {
      for (let x = 0; x < wheelSize; x++) {
        const rx = x - radius;
        const ry = y - radius;
        const distance = Math.sqrt(rx * rx + ry * ry);
        const maxRadius = radius - 2;

        if (distance <= maxRadius) {
          let angle = Math.atan2(ry, rx) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          const sat = distance / maxRadius;
          const rgb = hsvToRgb({ h: angle, s: sat, v: value });

          const idx = (y * wheelSize + x) * 4;
          data[idx] = rgb.r;
          data[idx + 1] = rgb.g;
          data[idx + 2] = rgb.b;
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(image, 0, 0);

    const indicatorAngle = (hue * Math.PI) / 180;
    const indicatorRadius = saturation * (radius - 2);
    const ix = radius + indicatorRadius * Math.cos(indicatorAngle);
    const iy = radius + indicatorRadius * Math.sin(indicatorAngle);

    ctx.beginPath();
    ctx.arc(ix, iy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ix, iy, 4, 0, Math.PI * 2);
    ctx.fillStyle = rgbToHex(hsvToRgb({ h: hue, s: saturation, v: value }));
    ctx.fill();
  }, [hue, saturation, value, wheelSize]);

  const drawBrightnessBar = useCallback(() => {
    const canvas = brightnessRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, brightnessWidth, 0);
    gradient.addColorStop(0, rgbToHex(hsvToRgb({ h: hue, s: saturation, v: 0 })));
    gradient.addColorStop(1, rgbToHex(hsvToRgb({ h: hue, s: saturation, v: 1 })));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, brightnessWidth, brightnessHeight);

    const indicatorX = value * brightnessWidth;
    ctx.beginPath();
    ctx.arc(indicatorX, brightnessHeight / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(indicatorX, brightnessHeight / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = rgbToHex(hsvToRgb({ h: hue, s: saturation, v: value }));
    ctx.fill();
  }, [hue, saturation, value, brightnessWidth, brightnessHeight]);

  useEffect(() => {
    drawColorWheel();
  }, [drawColorWheel]);

  useEffect(() => {
    drawBrightnessBar();
  }, [drawBrightnessBar]);

  const handleWheelInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const radius = wheelSize / 2;
    const x = clientX - rect.left - radius;
    const y = clientY - rect.top - radius;
    const distance = Math.sqrt(x * x + y * y);
    const maxRadius = radius - 2;

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    const sat = Math.min(distance / maxRadius, 1);

    setHue(angle);
    setSaturation(sat);
  };

  const handleBrightnessInteraction = (clientX: number) => {
    const canvas = brightnessRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, brightnessWidth));
    setValue(x / brightnessWidth);
  };

  const handleWheelMouseDown = (e: React.MouseEvent) => {
    setIsDraggingWheel(true);
    handleWheelInteraction(e.clientX, e.clientY);
  };

  const handleBrightnessMouseDown = (e: React.MouseEvent) => {
    setIsDraggingBrightness(true);
    handleBrightnessInteraction(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWheel) {
        handleWheelInteraction(e.clientX, e.clientY);
      }
      if (isDraggingBrightness) {
        handleBrightnessInteraction(e.clientX);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingWheel || isDraggingBrightness) {
        onColorSelect(rgbToHex(hsvToRgb({ h: hue, s: saturation, v: value })));
      }
      setIsDraggingWheel(false);
      setIsDraggingBrightness(false);
    };

    if (isDraggingWheel || isDraggingBrightness) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWheel, isDraggingBrightness, hue, saturation, value, onColorSelect]);

  const handleWheelTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingWheel(true);
    const touch = e.touches[0];
    handleWheelInteraction(touch.clientX, touch.clientY);
  };

  const handleBrightnessTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingBrightness(true);
    const touch = e.touches[0];
    handleBrightnessInteraction(touch.clientX);
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingWheel) {
        const touch = e.touches[0];
        handleWheelInteraction(touch.clientX, touch.clientY);
      }
      if (isDraggingBrightness) {
        const touch = e.touches[0];
        handleBrightnessInteraction(touch.clientX);
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingWheel || isDraggingBrightness) {
        onColorSelect(rgbToHex(hsvToRgb({ h: hue, s: saturation, v: value })));
      }
      setIsDraggingWheel(false);
      setIsDraggingBrightness(false);
    };

    if (isDraggingWheel || isDraggingBrightness) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingWheel, isDraggingBrightness, hue, saturation, value, onColorSelect]);

  const currentColor = rgbToHex(hsvToRgb({ h: hue, s: saturation, v: value }));

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('color', currentColor);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#333333' }}>色轮取色</div>
      <canvas
        ref={canvasRef}
        width={wheelSize}
        height={wheelSize}
        style={{ cursor: 'crosshair', borderRadius: '50%', touchAction: 'none' }}
        onMouseDown={handleWheelMouseDown}
        onTouchStart={handleWheelTouchStart}
        draggable
        onDragStart={handleDragStart}
      />
      <canvas
        ref={brightnessRef}
        width={brightnessWidth}
        height={brightnessHeight}
        style={{
          cursor: 'pointer',
          borderRadius: brightnessHeight / 2,
          touchAction: 'none',
        }}
        onMouseDown={handleBrightnessMouseDown}
        onTouchStart={handleBrightnessTouchStart}
      />
      <div
        draggable
        onDragStart={handleDragStart}
        style={{
          width: 80,
          height: 40,
          backgroundColor: currentColor,
          borderRadius: 8,
          border: '1px solid #E0E0E0',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#FFFFFF',
          fontWeight: 600,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          userSelect: 'none',
        }}
      >
        {currentColor}
      </div>
      <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
        拖曳色块到工作区
      </div>
    </div>
  );
};

export default ColorWheel;
