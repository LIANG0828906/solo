import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { HSL } from '@/types';
import { hslToHex, getContrastColor } from '@/utils/colorUtils';

interface ColorWheelProps {
  hsl: HSL;
  onChange: (hsl: HSL) => void;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({ hsl, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const innerRadius = radius - 40;

    ctx.clearRect(0, 0, size, size);

    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = (angle + 2) * Math.PI / 180;

      const gradient = ctx.createRadialGradient(center, center, innerRadius, center, center, radius);
      gradient.addColorStop(0, hslToHex(angle, 100, 100));
      gradient.addColorStop(0.5, hslToHex(angle, 100, 50));
      gradient.addColorStop(1, hslToHex(angle, 100, 20));

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(center, center, innerRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const indicatorAngle = hsl.h * Math.PI / 180;
    const indicatorRadius = innerRadius + (radius - innerRadius) * (1 - hsl.l / 100);
    const indicatorX = center + Math.cos(indicatorAngle) * indicatorRadius;
    const indicatorY = center + Math.sin(indicatorAngle) * indicatorRadius;

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 12, 0, Math.PI * 2);
    ctx.fillStyle = hslToHex(hsl.h, hsl.s, hsl.l);
    ctx.fill();
    ctx.strokeStyle = getContrastColor(hslToHex(hsl.h, hsl.s, hsl.l));
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 16, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [hsl]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const handlePointerEvent = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const center = canvas.width / 2;
    const dx = x - center;
    const dy = y - center;
    
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const newH = ((angle % 360) + 360) % 360;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = center - 10;
    const innerRadius = radius - 40;
    
    if (distance >= innerRadius && distance <= radius) {
      const normalizedDist = (distance - innerRadius) / (radius - innerRadius);
      const newL = Math.round(100 - normalizedDist * 80);
      onChange({ ...hsl, h: Math.round(newH), l: newL });
    } else if (distance < innerRadius) {
      onChange({ ...hsl, h: Math.round(newH) });
    }
  }, [hsl, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePointerEvent(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handlePointerEvent(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    handlePointerEvent(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handlePointerEvent(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div ref={containerRef} className="relative select-none">
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        className="w-full max-w-[280px] mx-auto cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
      <div 
        className="mt-4 py-3 px-4 rounded-lg text-center font-mono text-sm transition-colors duration-200"
        style={{ 
          backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l),
          color: getContrastColor(hslToHex(hsl.h, hsl.s, hsl.l))
        }}
      >
        {hslToHex(hsl.h, hsl.s, hsl.l)}
      </div>
    </div>
  );
};
