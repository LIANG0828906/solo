import React, { useEffect, useRef, useCallback, useState } from 'react';
import Toolbar from '@/components/Toolbar';
import { useCanvasStore, screenToWorld } from '@/hooks/useCanvas';
import type { BrushType, Point } from '@/utils/geometry';
import { generateSymmetricPaths } from '@/utils/geometry';

const COLOR_PALETTE: string[] = [
  '#E91E63', '#FF5722', '#FF9800', '#FFC107',
  '#FFEB3B', '#4CAF50', '#00BCD4', '#2196F3',
  '#3F51B5', '#9C27B0', '#673AB7', '#000000'
];

function drawBrushStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  brush: BrushType,
  opacity: number = 0.8,
  startHue: number = 0,
  endHue: number = 360
) {
  if (points.length === 0) return;

  let totalLength = 0;
  const segmentLengths: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(len);
    totalLength += len;
  }

  const getHueAt = (index: number, localT: number = 0): number => {
    if (points.length === 1) return startHue;
    let acc = 0;
    for (let i = 0; i < index - 1; i++) acc += segmentLengths[i];
    if (index > 0 && index - 1 < segmentLengths.length) {
      acc += segmentLengths[index - 1] * localT;
    }
    const t = totalLength === 0 ? 0 : acc / totalLength;
    return startHue + (endHue - startHue) * t;
  };

  ctx.globalAlpha = opacity;

  if (brush === 'dot') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const segLen = segmentLengths[i - 1];
      const steps = Math.max(1, Math.ceil(segLen / 1.5));
      for (let s = 0; s <= steps; s++) {
        const tt = s / steps;
        const x = prev.x + (cur.x - prev.x) * tt;
        const y = prev.y + (cur.y - prev.y) * tt;
        const hue = getHueAt(i, tt);
        ctx.fillStyle = `hsla(${hue}, 70%, 55%, 1)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (points.length === 1) {
      const hue = startHue;
      ctx.fillStyle = `hsla(${hue}, 70%, 55%, 1)`;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (brush === 'petal') {
    const spacing = 5;
    let acc = 0;
    const drawPetal = (cx: number, cy: number, hue: number) => {
      ctx.fillStyle = `hsla(${hue}, 70%, 55%, 1)`;
      for (let k = 0; k < 3; k++) {
        const angle = (k * 120 * Math.PI) / 180;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
    if (points.length === 1) {
      drawPetal(points[0].x, points[0].y, getHueAt(0));
    }
    for (let i = 1; i < points.length; i++) {
      const segLen = segmentLengths[i - 1];
      const startAcc = acc;
      const step = spacing;
      let offset = 0;
      while (offset < segLen) {
        const tt = segLen === 0 ? 0 : offset / segLen;
        const x = points[i - 1].x + (points[i].x - points[i - 1].x) * tt;
        const y = points[i - 1].y + (points[i].y - points[i - 1].y) * tt;
        const globalT = totalLength === 0 ? 0 : (startAcc + offset) / totalLength;
        const hue = startHue + (endHue - startHue) * globalT;
        drawPetal(x, y, hue);
        offset += step;
      }
      acc += segLen;
    }
  } else if (brush === 'star') {
    const spacing = 8;
    let acc = 0;
    const drawStar = (cx: number, cy: number, hue: number) => {
      ctx.fillStyle = `hsla(${hue}, 70%, 55%, 1)`;
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const r = k % 2 === 0 ? 6 : 3;
        const a = (k * Math.PI) / 8 - Math.PI / 2;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };
    if (points.length === 1) {
      drawStar(points[0].x, points[0].y, getHueAt(0));
    }
    for (let i = 1; i < points.length; i++) {
      const segLen = segmentLengths[i - 1];
      const startAcc = acc;
      let offset = 0;
      while (offset < segLen) {
        const tt = segLen === 0 ? 0 : offset / segLen;
        const x = points[i - 1].x + (points[i].x - points[i - 1].x) * tt;
        const y = points[i - 1].y + (points[i].y - points[i - 1].y) * tt;
        const globalT = totalLength === 0 ? 0 : (startAcc + offset) / totalLength;
        const hue = startHue + (endHue - startHue) * globalT;
        drawStar(x, y, hue);
        offset += spacing;
      }
      acc += segLen;
    }
  } else if (brush === 'wave') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    let accLen = 0;
    const amplitude = 6;
    const wavelength = 20;
    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1];
      const to = points[i];
      const segLen = segmentLengths[i - 1];
      const steps = Math.max(2, Math.ceil(segLen / 3));
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = segLen || 1;
      const nx = -dy / len;
      const ny = dx / len;
      for (let s = 0; s <= steps; s++) {
        const tt = s / steps;
        const bx = from.x + dx * tt;
        const by = from.y + dy * tt;
        const globalT = totalLength === 0 ? 0 : (accLen + tt * segLen) / totalLength;
        const phase = ((accLen + tt * segLen) / wavelength) * Math.PI * 2;
        const offset = Math.sin(phase) * amplitude;
        const wx = bx + nx * offset;
        const wy = by + ny * offset;
        const hue = startHue + (endHue - startHue) * globalT;
        ctx.strokeStyle = `hsla(${hue}, 70%, 55%, 1)`;
        if (s === 0) {
          ctx.beginPath();
          ctx.moveTo(wx, wy);
        } else {
          ctx.lineTo(wx, wy);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(wx, wy);
        }
      }
      accLen += segLen;
    }
  }

  ctx.globalAlpha = 1;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const pendingRenderRef = useRef(false);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStartRef = useRef<{ dist: number; scale: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const {
    paths,
    viewport,
    transitioningViewport,
    brush,
    symmetry,
    currentColor,
    isDrawing,
    currentSymmetricPaths,
    setCanvasSize,
    startDrawing,
    continueDrawing,
    endDrawing,
    setColor,
    setViewport,
    setTransitionViewport,
    undo,
    redo,
    exportSVG,
    getCenter
  } = useCanvasStore();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vp = transitioningViewport || viewport;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(vp.offsetX, vp.offsetY);
    ctx.scale(vp.scale, vp.scale);

    for (const path of paths) {
      for (const sym of path.symmetricPaths) {
        const alpha = path.fadeOpacity * path.opacity;
        if (alpha <= 0.01) continue;
        drawBrushStroke(ctx, sym, path.brush, alpha, path.startHue, path.endHue);
      }
    }

    if (isDrawing && currentSymmetricPaths.length > 0) {
      for (const sym of currentSymmetricPaths) {
        drawBrushStroke(ctx, sym, brush, 0.8, 0, 360);
      }
    }

    ctx.restore();
    pendingRenderRef.current = false;
  }, [paths, viewport, transitioningViewport, isDrawing, currentSymmetricPaths, brush]);

  const scheduleRender = useCallback(() => {
    if (pendingRenderRef.current) return;
    pendingRenderRef.current = true;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
  }, [render]);

  useEffect(() => {
    scheduleRender();
  }, [scheduleRender]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setCanvasSize(w, h);
      scheduleRender();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCanvasSize, scheduleRender]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const getCanvasPos = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const vp = transitioningViewport || viewport;
    return screenToWorld(clientX - rect.left, clientY - rect.top, vp);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || e.button === 2) {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const p = getCanvasPos(e.clientX, e.clientY);
    startDrawing(p);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      setTransitionViewport(null);
      setViewport({ offsetX: viewport.offsetX + dx, offsetY: viewport.offsetY + dy });
      return;
    }
    if (!isDrawing) return;
    const p = getCanvasPos(e.clientX, e.clientY);
    continueDrawing(p);
  };

  const onMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    endDrawing();
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey) && !e.altKey) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    const oldScale = viewport.scale;
    const newScale = Math.max(0.5, Math.min(4, oldScale * (1 + delta)));
    const ratio = newScale / oldScale;
    const newOffsetX = mx - (mx - viewport.offsetX) * ratio;
    const newOffsetY = my - (my - viewport.offsetY) * ratio;
    setTransitionViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    setViewport({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    setTimeout(() => setTransitionViewport(null), 300);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pinchStartRef.current = { dist, scale: viewport.scale };
      return;
    }
    if (e.touches.length === 1 && pinchStartRef.current === null) {
      const t = e.touches[0];
      if (isDraggingRef.current === false) {
        const p = getCanvasPos(t.clientX, t.clientY);
        startDrawing(p);
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (pinchStartRef.current && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchStartRef.current.dist;
      const newScale = Math.max(0.5, Math.min(4, pinchStartRef.current.scale * ratio));
      setViewport({ scale: newScale });
      return;
    }
    if (e.touches.length === 1 && isDrawing) {
      const t = e.touches[0];
      const p = getCanvasPos(t.clientX, t.clientY);
      continueDrawing(p);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      pinchStartRef.current = null;
      if (isDrawing) endDrawing();
      isDraggingRef.current = false;
    }
  };

  const handleExport = useCallback(() => {
    setIsExporting(true);
    try {
      const svgContent = exportSVG();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `geometry_${timestamp}.svg`;
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsExporting(false), 200);
    }
  }, [exportSVG]);

  const scalePct = Math.round(viewport.scale * 100);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        background: '#F5F5F5',
        fontFamily: '"Noto Sans SC", Roboto, sans-serif'
      }}
    >
      <Toolbar onExport={handleExport} isExporting={isExporting} />

      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          display: 'block',
          cursor: isDrawing ? 'crosshair' : isDraggingRef.current ? 'grabbing' : 'crosshair',
          touchAction: 'none',
          marginTop: 56,
          transition: transitioningViewport ? 'transform 0.3s ease-out' : 'none'
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 72,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          zIndex: 900,
          transition: 'all 0.2s ease'
        }}
        className="color-preview"
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: currentColor,
            boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.1)',
            transition: 'background 0.2s ease'
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#37474F',
            fontFamily: 'Roboto, monospace'
          }}
        >
          {currentColor.toUpperCase()}
        </span>
      </div>

      <div
        style={{
          position: 'fixed',
          top: 72,
          right: 16,
          padding: '6px 14px',
          background: 'rgba(38, 50, 56, 0.9)',
          color: '#ECEFF1',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'Roboto, monospace',
          zIndex: 900,
          minWidth: 60,
          textAlign: 'center',
          transition: 'all 0.3s ease-out',
          backdropFilter: 'blur(8px)'
        }}
        className="zoom-indicator"
      >
        {scalePct}%
      </div>

      <div
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 24,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 900,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)'
        }}
        className="palette-container"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 24px)',
            gridAutoRows: '24px',
            gap: 8
          }}
          className="palette-grid"
        >
          {COLOR_PALETTE.map((color, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setColor(color)}
              title={color}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: currentColor === color ? '2px solid #263238' : '2px solid transparent',
                background: color,
                cursor: 'pointer',
                padding: 0,
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                transform: currentColor === color ? 'scale(1.15)' : 'scale(1)',
                boxShadow: currentColor === color ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.15)'
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .toolbar-main {
            flex-direction: column !important;
            width: 48px !important;
            height: 100vh !important;
            padding: 12px 4px !important;
            left: 0 !important;
            right: auto !important;
            top: 0 !important;
          }
          .toolbar-left, .toolbar-right {
            flex-direction: column !important;
            width: 100% !important;
            gap: 8px !important;
            padding: 0 !important;
          }
          .toolbar-title {
            display: none !important;
          }
          .brush-group {
            flex-direction: column !important;
            padding: 8px 4px !important;
          }
          .symmetry-group {
            flex-direction: column !important;
            height: auto !important;
            padding: 8px 4px !important;
            gap: 6px !important;
          }
          .symmetry-group input {
            width: 40px !important;
            writing-mode: vertical-lr;
            direction: rtl;
          }
          .toolbar-divider {
            width: 28px !important;
            height: 1px !important;
            margin: 4px 0 !important;
          }
          .export-label {
            display: none !important;
          }
          canvas {
            margin-top: 0 !important;
            margin-left: 48px !important;
          }
          .color-preview, .zoom-indicator {
            top: 16px !important;
          }
          .zoom-indicator {
            right: 12px !important;
          }
          .palette-container {
            left: auto !important;
            right: 16px !important;
            transform: none !important;
            width: calc(100% - 80px) !important;
            overflow-x: auto !important;
          }
          .palette-grid {
            grid-template-columns: repeat(12, 24px) !important;
            grid-template-rows: 24px !important;
            width: max-content !important;
          }
        }
        .toolbar-brush-btn:hover {
          background: rgba(255,255,255,0.1) !important;
          transform: translateY(-1px);
        }
        .toolbar-brush-btn:active {
          transform: translateY(0);
        }
        button[disabled] {
          pointer-events: none !important;
        }
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #4FC3F7;
          border-radius: 2px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        .palette-container::-webkit-scrollbar {
          height: 3px;
        }
      `}</style>
    </div>
  );
};

export default App;
