import { useEffect, useRef, useState, useCallback } from 'react';
import type { InkPoint, EmotionType } from '../types';
import { EMOTION_PALETTES } from '../types';
import { useDiaryStore } from '../store';
import { Eraser, RotateCcw } from 'lucide-react';

interface MainCanvasProps {
  readOnly?: boolean;
  points?: InkPoint[];
  emotion?: EmotionType;
  width?: number;
  height?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function getEmotionColorWithVariation(emotion: EmotionType): [number, number, number] {
  const palette = EMOTION_PALETTES.find((p) => p.type === emotion) ?? EMOTION_PALETTES[0];
  const [r, g, b] = hexToRgb(palette.color);
  const vr = Math.floor((Math.random() - 0.5) * 28);
  const vg = Math.floor((Math.random() - 0.5) * 28);
  const vb = Math.floor((Math.random() - 0.5) * 28);
  return [
    Math.max(0, Math.min(255, r + vr)),
    Math.max(0, Math.min(255, g + vg)),
    Math.max(0, Math.min(255, b + vb)),
  ];
}

export default function MainCanvas({
  readOnly = false,
  points: externalPoints,
  emotion: externalEmotion,
}: MainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number; t: number } | null>(null);
  const rafId = useRef<number | null>(null);
  const pendingPoints = useRef<InkPoint[]>([]);

  const selectedEmotion = useDiaryStore((s) => s.selectedEmotion);
  const currentInkPoints = useDiaryStore((s) => s.currentInkPoints);
  const appendInkPoint = useDiaryStore((s) => s.appendInkPoint);
  const setCurrentInkPoints = useDiaryStore((s) => s.setCurrentInkPoints);

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  const effectiveEmotion = externalEmotion ?? selectedEmotion;
  const effectivePoints = externalPoints ?? currentInkPoints;

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.width * 0.75));
      setCanvasSize({ w, h });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const renderInk = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { w, h } = canvasSize;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,253,248,0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < effectivePoints.length; i++) {
      const p0 = effectivePoints[i - 1];
      const p1 = effectivePoints[i];

      const steps = Math.max(1, Math.floor(Math.hypot(p1.x - p0.x, p1.y - p0.y) / 1.5));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = p0.x + (p1.x - p0.x) * t;
        const y = p0.y + (p1.y - p0.y) * t;
        const size = p0.size + (p1.size - p0.size) * t;
        const opacity = p0.opacity + (p1.opacity - p0.opacity) * t;
        const [r, g, b] = hexToRgb(p1.color);

        const layers = 3;
        for (let l = 0; l < layers; l++) {
          const layerSize = size * (1 - l * 0.22);
          const layerOpacity = opacity * (l === 0 ? 0.85 : l === 1 ? 0.45 : 0.2);
          const jitterX = (Math.random() - 0.5) * size * 0.25;
          const jitterY = (Math.random() - 0.5) * size * 0.25;

          const radial = ctx.createRadialGradient(
            x + jitterX,
            y + jitterY,
            0,
            x + jitterX,
            y + jitterY,
            layerSize * 0.55
          );
          radial.addColorStop(0, `rgba(${r},${g},${b},${layerOpacity})`);
          radial.addColorStop(0.55, `rgba(${r},${g},${b},${layerOpacity * 0.5})`);
          radial.addColorStop(1, `rgba(${r},${g},${b},0)`);

          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(x + jitterX, y + jitterY, layerSize * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [effectivePoints, canvasSize]);

  useEffect(() => {
    renderInk();
  }, [renderInk]);

  const flushPending = useCallback(() => {
    if (pendingPoints.current.length > 0 && !readOnly) {
      const batch = pendingPoints.current;
      pendingPoints.current = [];
      setCurrentInkPoints([...currentInkPoints, ...batch]);
    }
    rafId.current = null;
  }, [currentInkPoints, readOnly, setCurrentInkPoints]);

  const getCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasSize.w / rect.width),
      y: (e.clientY - rect.top) * (canvasSize.h / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const { x, y } = getCoords(e);
    lastPoint.current = { x, y, t: performance.now() };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current || readOnly) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    const now = performance.now();
    const last = lastPoint.current;
    if (!last) return;

    const dx = x - last.x;
    const dy = y - last.y;
    const dist = Math.hypot(dx, dy);
    const dt = Math.max(1, now - last.t);
    const velocity = dist / dt;
    const pressure = (e.pressure && e.pressure > 0 ? e.pressure : 0.5);

    const velocityFactor = Math.min(1, velocity * 0.08);
    const baseSize = 10 + pressure * 18;
    const size = baseSize * (1.4 - velocityFactor * 0.6);
    const opacity = 0.35 + (1 - velocityFactor) * 0.45 + pressure * 0.15;

    const [r, g, b] = getEmotionColorWithVariation(effectiveEmotion);
    const color = `rgb(${r},${g},${b})`;

    const point: InkPoint = {
      x,
      y,
      pressure,
      velocity,
      timestamp: now,
      color,
      size,
      opacity: Math.min(0.95, opacity),
    };

    pendingPoints.current.push(point);
    lastPoint.current = { x, y, t: now };

    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(flushPending);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (readOnly) return;
    isDrawing.current = false;
    lastPoint.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    flushPending();
  };

  const handleClear = () => {
    if (readOnly) return;
    setCurrentInkPoints([]);
  };

  const handleUndo = () => {
    if (readOnly) return;
    if (currentInkPoints.length === 0) return;
    const cutoff = Math.max(0, currentInkPoints.length - 40);
    setCurrentInkPoints(currentInkPoints.slice(0, cutoff));
  };

  return (
    <div className="canvas-wrapper">
      {!readOnly && (
        <div className="canvas-header">
          <div className="emotion-palette">
            {EMOTION_PALETTES.map((p) => (
              <div
                key={p.type}
                className={`emotion-swatch ${selectedEmotion === p.type ? 'active' : ''}`}
                style={{ background: p.color }}
                onClick={() => useDiaryStore.getState().setSelectedEmotion(p.type)}
                title={p.name}
              >
                <span className="emotion-swatch-label">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="canvas-tools">
            <button className="tool-btn" onClick={handleUndo} title="撤销">
              <RotateCcw size={18} />
            </button>
            <button className="tool-btn" onClick={handleClear} title="清空">
              <Eraser size={18} />
            </button>
          </div>
        </div>
      )}
      <div className="canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="ink-canvas"
          style={{ width: canvasSize.w, height: canvasSize.h }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  );
}

export function generateThumbnail(
  points: InkPoint[],
  emotion: EmotionType,
  size: { w: number; h: number } = { w: 240, h: 180 }
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = 'rgba(255,253,248,0.92)';
  ctx.fillRect(0, 0, size.w, size.h);

  if (points.length === 0) {
    const palette = EMOTION_PALETTES.find((p) => p.type === emotion) ?? EMOTION_PALETTES[0];
    const [r, g, b] = hexToRgb(palette.color);
    const gradient = ctx.createRadialGradient(
      size.w * 0.5, size.h * 0.5, 0,
      size.w * 0.5, size.h * 0.5, size.w * 0.5
    );
    gradient.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0.05)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.w, size.h);
    return canvas.toDataURL('image/png');
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const rangeW = Math.max(1, maxX - minX);
  const rangeH = Math.max(1, maxY - minY);
  const scale = Math.min((size.w * 0.85) / rangeW, (size.h * 0.85) / rangeH);
  const offsetX = (size.w - rangeW * scale) * 0.5 - minX * scale;
  const offsetY = (size.h - rangeH * scale) * 0.5 - minY * scale;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const steps = Math.max(1, Math.floor(Math.hypot(p1.x - p0.x, p1.y - p0.y) / 2));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = (p0.x + (p1.x - p0.x) * t) * scale + offsetX;
      const y = (p0.y + (p1.y - p0.y) * t) * scale + offsetY;
      const sz = (p0.size + (p1.size - p0.size) * t) * scale * 0.9;
      const op = p0.opacity + (p1.opacity - p0.opacity) * t;
      const [r, g, b] = hexToRgb(p1.color);

      for (let l = 0; l < 2; l++) {
        const layerSz = sz * (1 - l * 0.25);
        const layerOp = op * (l === 0 ? 0.8 : 0.35);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, layerSz * 0.55);
        grad.addColorStop(0, `rgba(${r},${g},${b},${layerOp})`);
        grad.addColorStop(0.6, `rgba(${r},${g},${b},${layerOp * 0.4})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, layerSz * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return canvas.toDataURL('image/png');
}
