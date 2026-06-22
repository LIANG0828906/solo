import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { HSV } from './utils/types';
import { hsvToHex, hexToHsv } from './utils/colorUtils';
import { Sun, Droplets } from 'lucide-react';

interface ColorWheelProps {
  hsv: HSV;
  onChange: (hsv: HSV) => void;
}

const WHEEL_SIZE = 280;
const WHEEL_RADIUS = 110;
const CENTER = WHEEL_SIZE / 2;

const ColorWheel: React.FC<ColorWheelProps> = ({ hsv, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const animationRef = useRef<number | null>(null);
  const pendingHueRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WHEEL_SIZE * dpr;
    canvas.height = WHEEL_SIZE * dpr;
    canvas.style.width = `${WHEEL_SIZE}px`;
    canvas.style.height = `${WHEEL_SIZE}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = (angle * Math.PI) / 180;
      const gradient = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, WHEEL_RADIUS);
      gradient.addColorStop(0, `hsl(${angle}, 0%, 100%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.arc(CENTER, CENTER, WHEEL_RADIUS, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    const overlayGradient = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, WHEEL_RADIUS);
    overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = overlayGradient;
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, WHEEL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const updateHue = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - CENTER;
    const y = clientY - rect.top - CENTER;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    let hue = (angle + 360) % 360;
    pendingHueRef.current = hue;
  }, []);

  const applyPendingHue = useCallback(() => {
    if (pendingHueRef.current !== null) {
      onChange({ ...hsv, h: pendingHueRef.current });
      pendingHueRef.current = null;
    }
    animationRef.current = null;
  }, [hsv, onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateHue(e.clientX, e.clientY);
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(applyPendingHue);
    }
  }, [updateHue, applyPendingHue]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    updateHue(e.clientX, e.clientY);
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(applyPendingHue);
    }
  }, [isDragging, updateHue, applyPendingHue]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const markerAngle = (hsv.h * Math.PI) / 180;
  const markerRadius = WHEEL_RADIUS * (hsv.s / 100);
  const markerX = CENTER + Math.cos(markerAngle) * markerRadius;
  const markerY = CENTER + Math.sin(markerAngle) * markerRadius;
  const currentHex = hsvToHex(hsv);

  const brightnessGradient = `linear-gradient(to right, #000000, ${currentHex}, #FFFFFF)`;
  const saturationStart = hsvToHex({ h: hsv.h, s: 0, v: hsv.v });
  const saturationEnd = hsvToHex({ h: hsv.h, s: 100, v: hsv.v });
  const saturationGradient = `linear-gradient(to right, ${saturationStart}, ${saturationEnd})`;

  return (
    <div className="color-wheel-container" ref={containerRef}>
      <style>{`
        .color-wheel-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          background: var(--bg-card);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft);
          transition: all var(--transition-normal);
        }
        .color-wheel-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        .color-wheel-wrapper {
          position: relative;
          width: ${WHEEL_SIZE}px;
          height: ${WHEEL_SIZE}px;
          margin-bottom: 24px;
        }
        .color-wheel-canvas {
          cursor: crosshair;
          border-radius: 50%;
          touch-action: none;
        }
        .color-wheel-marker {
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 3px solid #fff;
          background: ${currentHex};
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 0 15px ${currentHex}80, 0 0 30px ${currentHex}40;
          transform: translate(-50%, -50%);
          left: ${markerX}px;
          top: ${markerY}px;
          pointer-events: none;
          transition: left 0.2s ease, top 0.2s ease, background 0.1s ease;
          z-index: 10;
        }
        .color-preview-circle {
          position: absolute;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: ${currentHex};
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 4px 20px ${currentHex}40;
          transition: background var(--transition-fast);
        }
        .color-sliders {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .slider-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .slider-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .slider-label-icon {
          display: flex;
          align-items: center;
          width: 16px;
          height: 16px;
        }
        .slider-track {
          position: relative;
          width: 100%;
          height: 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        .slider-thumb {
          position: absolute;
          top: 50%;
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transform: translate(-50%, -50%);
          cursor: grab;
          transition: transform var(--transition-fast);
          pointer-events: none;
        }
        .slider-thumb:active {
          cursor: grabbing;
        }
        .color-value-display {
          margin-top: 20px;
          padding: 12px 20px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          text-align: center;
        }
        .color-hex {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 1px;
          font-family: 'Courier New', monospace;
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 12px;
          border-radius: 6px;
          outline: none;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          cursor: pointer;
          border: none;
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          cursor: pointer;
          border: none;
        }
      `}</style>
      <div className="color-wheel-title">色彩选择</div>
      <div className="color-wheel-wrapper">
        <canvas
        ref={canvasRef}
        className="color-wheel-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="color-preview-circle" />
      <div className="color-wheel-marker" />
    </div>
      <div className="color-sliders">
        <div className="slider-group">
          <div className="slider-label">
            <span className="slider-label-icon"><Sun size={16} /></span>
            <span>亮度</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-primary)', fontWeight: 600 }}>{Math.round(hsv.v)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={hsv.v}
            onChange={(e) => onChange({ ...hsv, v: Number(e.target.value) })}
            style={{ background: brightnessGradient }}
          />
        </div>
        <div className="slider-group">
          <div className="slider-label">
            <span className="slider-label-icon"><Droplets size={16} /></span>
            <span>饱和度</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-primary)', fontWeight: 600 }}>{Math.round(hsv.s)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={hsv.s}
            onChange={(e) => onChange({ ...hsv, s: Number(e.target.value) })}
            style={{ background: saturationGradient }}
          />
        </div>
      </div>
      <div className="color-value-display">
        <span className="color-hex" style={{ color: currentHex }}>{currentHex}</span>
      </div>
    </div>
  );
};

export default React.memo(ColorWheel);
