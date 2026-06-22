import React, { useRef, useEffect, useCallback, useState } from 'react';
import { hslToHex } from './colorUtils';

interface ColorWheelProps {
  onColorChange: (hex: string, hue: number) => void;
  currentHue: number;
}

const COLOR_WHEEL_SIZE = 400;
const DOT_SIZE = 16;
const GLOW_SIZE = 560;

const ColorWheel: React.FC<ColorWheelProps> = ({ onColorChange, currentHue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const animationRef = useRef<number>(0);
  const pendingHueRef = useRef<number | null>(null);

  const currentColor = hslToHex(currentHue, 75, 55);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = COLOR_WHEEL_SIZE;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = size / 2 - 2;
    const innerRadius = outerRadius * 0.55;

    ctx.clearRect(0, 0, size, size);

    for (let angle = 0; angle < 360; angle += 0.5) {
      const startAngle = ((angle - 0.3) * Math.PI) / 180;
      const endAngle = ((angle + 0.8) * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(
        cx + innerRadius * Math.cos(startAngle),
        cy + innerRadius * Math.sin(startAngle)
      );
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = `hsl(${angle}, 75%, 55%)`;
      ctx.fill();
    }

    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius);
    centerGrad.addColorStop(0, '#FEFAF6');
    centerGrad.addColorStop(1, '#FFF8F0');
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();

    const innerBorderGrad = ctx.createRadialGradient(cx, cy, innerRadius - 3, cx, cy, innerRadius + 2);
    innerBorderGrad.addColorStop(0, 'rgba(0,0,0,0.03)');
    innerBorderGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius + 1, 0, Math.PI * 2);
    ctx.fillStyle = innerBorderGrad;
    ctx.fill();
  }, []);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const getHueFromPoint = useCallback((clientX: number, clientY: number): number => {
    const container = containerRef.current;
    if (!container) return 0;

    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return Math.round(deg);
  }, []);

  const handleColorUpdate = useCallback((hue: number) => {
    pendingHueRef.current = hue;
    if (animationRef.current) return;

    const tick = () => {
      if (pendingHueRef.current !== null) {
        const h = pendingHueRef.current;
        const hex = hslToHex(h, 75, 55);
        onColorChange(hex, h);
        pendingHueRef.current = null;
      }
      animationRef.current = 0;
    };
    animationRef.current = requestAnimationFrame(tick);
  }, [onColorChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    const hue = getHueFromPoint(e.clientX, e.clientY);
    handleColorUpdate(hue);
  }, [getHueFromPoint, handleColorUpdate]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const hue = getHueFromPoint(e.clientX, e.clientY);
    handleColorUpdate(hue);
  }, [isDragging, getHueFromPoint, handleColorUpdate]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
  }, []);

  const hueRad = (currentHue * Math.PI) / 180;
  const pickerRadius = (COLOR_WHEEL_SIZE / 2) * 0.78;
  const dotX = COLOR_WHEEL_SIZE / 2 + Math.cos(hueRad) * pickerRadius - DOT_SIZE / 2;
  const dotY = COLOR_WHEEL_SIZE / 2 + Math.sin(hueRad) * pickerRadius - DOT_SIZE / 2;

  const glowOffset = (GLOW_SIZE - COLOR_WHEEL_SIZE) / 2;
  const glowX = COLOR_WHEEL_SIZE / 2 + Math.cos(hueRad) * pickerRadius - GLOW_SIZE / 2 + glowOffset;
  const glowY = COLOR_WHEEL_SIZE / 2 + Math.sin(hueRad) * pickerRadius - GLOW_SIZE / 2 + glowOffset;

  return (
    <div
      style={{
        position: 'relative',
        width: COLOR_WHEEL_SIZE,
        height: COLOR_WHEEL_SIZE,
        touchAction: 'none'
      }}
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        style={{
          position: 'absolute',
          left: glowX,
          top: glowY,
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          borderRadius: '50%',
          pointerEvents: 'none',
          background: `radial-gradient(circle, ${currentColor}4D 0%, transparent 55%)`,
          transform: 'translate(-80px, -80px)',
          transition: 'background 0.05s linear',
          zIndex: 0
        }}
      />

      <canvas
        ref={canvasRef}
        width={COLOR_WHEEL_SIZE}
        height={COLOR_WHEEL_SIZE}
        style={{
          position: 'relative',
          zIndex: 1,
          cursor: isDragging ? 'grabbing' : 'grab',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.08))'
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: dotX,
          top: dotY,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25), 0 0 0 1px rgba(120,120,120,0.3)',
          pointerEvents: 'none',
          zIndex: 3,
          transition: isDragging ? 'none' : 'left 0.08s ease-out, top 0.08s ease-out'
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -56,
          transform: 'translateX(-50%)',
          padding: '10px 22px',
          borderRadius: 12,
          background: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: 0.5,
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 5
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 6,
            background: currentColor,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
          }}
        />
        {currentColor}
      </div>
    </div>
  );
};

export default ColorWheel;
