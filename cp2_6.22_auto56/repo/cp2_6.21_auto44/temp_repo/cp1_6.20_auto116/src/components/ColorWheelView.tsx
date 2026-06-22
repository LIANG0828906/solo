import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import type { HSLColor } from '../types/color';
import { hslToHex, hslToString } from '../utils/colorUtils';

interface ColorWheelViewProps {
  baseColor: HSLColor;
  size?: number;
  onColorSelect: (color: HSLColor) => void;
}

const ColorWheelView: React.FC<ColorWheelViewProps> = ({
  baseColor,
  size = 400,
  onColorSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    color: HSLColor;
    visible: boolean;
  } | null>(null);

  const dpr = useMemo(() => typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, []);
  const canvasSize = useMemo(() => size * dpr, [size, dpr]);
  const center = useMemo(() => canvasSize / 2, [canvasSize]);
  const outerRadius = useMemo(() => center - 30 * dpr, [center, dpr]);
  const innerRadius = useMemo(() => outerRadius - 40 * dpr, [outerRadius, dpr]);

  const getColorFromPosition = useCallback((clientX: number, clientY: number): HSLColor | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < innerRadius || distance > outerRadius) return null;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    if (angle >= 360) angle -= 360;

    const saturation = ((distance - innerRadius) / (outerRadius - innerRadius)) * 100;

    return {
      h: Math.round(angle),
      s: Math.round(saturation),
      l: baseColor.l,
    };
  }, [center, innerRadius, outerRadius, dpr, baseColor.l]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const color = getColorFromPosition(e.clientX, e.clientY);
    if (color) {
      setIsDragging(true);
      onColorSelect(color);
    }
  }, [getColorFromPosition, onColorSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const color = getColorFromPosition(e.clientX, e.clientY);

    if (isDragging && color) {
      onColorSelect(color);
    }

    if (color) {
      setHoverInfo({
        x: e.clientX,
        y: e.clientY,
        color,
        visible: true,
      });
    } else {
      setHoverInfo(prev => prev ? { ...prev, visible: false } : null);
    }
  }, [isDragging, getColorFromPosition, onColorSelect]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHoverInfo(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 90) * (Math.PI / 180);
      const endAngle = (angle + 1 - 90) * (Math.PI / 180);

      for (let i = 0; i < 100; i += 2) {
        const saturation = i / 100;
        const radius1 = innerRadius + (outerRadius - innerRadius) * saturation;
        const radius2 = innerRadius + (outerRadius - innerRadius) * Math.min((i + 2) / 100, 1);

        ctx.beginPath();
        ctx.arc(center, center, radius2, startAngle, endAngle);
        ctx.arc(center, center, radius1, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = `hsl(${angle}, ${i}%, ${baseColor.l}%)`;
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1 * dpr;

    for (let angle = 0; angle < 360; angle += 10) {
      const isMajor = angle % 30 === 0;
      const radian = (angle - 90) * (Math.PI / 180);
      const tickLength = isMajor ? 12 * dpr : 6 * dpr;
      const tickWidth = isMajor ? 2 * dpr : 1 * dpr;

      const cos = Math.cos(radian);
      const sin = Math.sin(radian);

      ctx.beginPath();
      ctx.moveTo(center + cos * outerRadius, center + sin * outerRadius);
      ctx.lineTo(center + cos * (outerRadius - tickLength), center + sin * (outerRadius - tickLength));
      ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = tickWidth;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(center + cos * innerRadius, center + sin * innerRadius);
      ctx.lineTo(center + cos * (innerRadius + tickLength), center + sin * (innerRadius + tickLength));
      ctx.stroke();
    }

    const selectedAngle = (baseColor.h - 90) * (Math.PI / 180);
    const selectedRadius = innerRadius + (outerRadius - innerRadius) * (baseColor.s / 100);
    const indicatorX = center + Math.cos(selectedAngle) * selectedRadius;
    const indicatorY = center + Math.sin(selectedAngle) * selectedRadius;
    const indicatorRadius = 10 * dpr;

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3 * dpr;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, indicatorRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%)`;
    ctx.fill();
  }, [canvasSize, center, outerRadius, innerRadius, dpr, baseColor]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          width: size,
          height: size,
          cursor: 'crosshair',
          borderRadius: '50%',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {hoverInfo?.visible && (
        <div
          style={{
            position: 'fixed',
            left: hoverInfo.x + 15,
            top: hoverInfo.y + 15,
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 1000,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#888' }}>HEX: </span>
            {hslToHex(hoverInfo.color).toUpperCase()}
          </div>
          <div>
            <span style={{ color: '#888' }}>HSL: </span>
            {hslToString(hoverInfo.color)}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ColorWheelView);
