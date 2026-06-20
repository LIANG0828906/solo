import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import {
  initializeCanvas,
  drawStroke,
  drawStrokeSegment,
  redrawAll,
  screenToCanvas,
  generateThumbnail,
  clearCanvas,
} from '@/modules/canvasEngine';
import { CANVAS_SIZE } from '@/types';

interface CanvasAreaProps {
  onSaveRequest: (fn: () => void) => void;
}

export default function CanvasArea({ onSaveRequest }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastDrawIndexRef = useRef(0);
  const lastViewportRef = useRef({ offsetX: 0, offsetY: 0 });

  const {
    viewport,
    setViewport,
    strokes,
    activeStroke,
    startStroke,
    appendStrokePoint,
    finishStroke,
    saveCurrentDoodle,
  } = useCanvasStore();

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;
    const thumb = generateThumbnail(canvas);
    void saveCurrentDoodle(thumb);
  }, [strokes, saveCurrentDoodle]);

  useEffect(() => {
    onSaveRequest(handleSave);
  }, [handleSave, onSaveRequest]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      ctxRef.current = initializeCanvas(canvas);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    clearCanvas(ctx);
    redrawAll(ctx, strokes, viewport);
    if (activeStroke) drawStroke(ctx, activeStroke, viewport);
    lastViewportRef.current = viewport;
  }, [strokes, viewport]);

  useEffect(() => {
    if (!activeStroke || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const len = activeStroke.points.length;
    if (len === 1) {
      drawStroke(ctx, activeStroke, viewport);
    } else {
      drawStrokeSegment(ctx, activeStroke, viewport, Math.max(0, lastDrawIndexRef.current - 1));
    }
    lastDrawIndexRef.current = len;
  }, [activeStroke, viewport]);

  const flushRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const scheduleAppend = (x: number, y: number) => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = null;
        return;
      }
      const p = screenToCanvas(x, y, canvas, viewport);
      appendStrokePoint(p);
      rafRef.current = null;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    const point = screenToCanvas(e.clientX, e.clientY, canvas, viewport);
    startStroke(point);
    lastDrawIndexRef.current = 1;
    isDrawingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    scheduleAppend(e.clientX, e.clientY);
  };

  const endDrawing = () => {
    if (!isDrawingRef.current) return;
    flushRaf();
    finishStroke();
    lastDrawIndexRef.current = 0;
    isDrawingRef.current = false;
  };

  const handleMouseUp = () => endDrawing();
  const handleMouseLeave = () => endDrawing();

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    setViewport({
      offsetX: Math.max(0, Math.min(CANVAS_SIZE.width * 0.5, viewport.offsetX + e.deltaX)),
      offsetY: Math.max(0, Math.min(CANVAS_SIZE.height * 0.5, viewport.offsetY + e.deltaY)),
    });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current || e.touches.length === 0) return;
    const t = e.touches[0];
    const point = screenToCanvas(t.clientX, t.clientY, canvas, viewport);
    startStroke(point);
    lastDrawIndexRef.current = 1;
    isDrawingRef.current = true;
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.touches.length === 0) return;
    const t = e.touches[0];
    scheduleAppend(t.clientX, t.clientY);
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    endDrawing();
    e.preventDefault();
  };

  useEffect(() => {
    const el = scrollRef.current;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
    };
    if (el) el.addEventListener('wheel', handler, { passive: false });
    return () => {
      if (el) el.removeEventListener('wheel', handler);
    };
  }, []);

  return (
    <div className="canvas-area">
      <div
        className="canvas-scroll"
        ref={scrollRef}
        onWheel={handleWheel}
      >
        <div
          className="canvas-wrapper"
          style={{
            transform: `translate(${-viewport.offsetX}px, ${-viewport.offsetY}px)`,
            width: CANVAS_SIZE.width,
            height: CANVAS_SIZE.height,
          }}
        >
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      </div>

      <div className="viewport-hint">
        偏移: ({Math.round(viewport.offsetX)}, {Math.round(viewport.offsetY)}) &nbsp;|&nbsp; 画布: {CANVAS_SIZE.width}x{CANVAS_SIZE.height}
      </div>

      <style>{`
        .canvas-area {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          bottom: 0;
          background: #1A1A2E;
          overflow: hidden;
          animation: canvasFade 0.5s ease;
        }
        @keyframes canvasFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .canvas-scroll {
          width: 100%;
          height: 100%;
          overflow: auto;
          position: relative;
          cursor: crosshair;
          background:
            radial-gradient(circle at 20% 20%, rgba(94, 234, 212, 0.04), transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(129, 140, 248, 0.04), transparent 50%),
            #1A1A2E;
        }
        .canvas-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .canvas-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
        }
        .canvas-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 5px;
        }
        .canvas-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .canvas-wrapper {
          position: relative;
          transform-origin: top left;
          transition: transform 0.05s linear;
        }
        .drawing-canvas {
          display: block;
          width: ${CANVAS_SIZE.width}px;
          height: ${CANVAS_SIZE.height}px;
          background:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px) 0 0 / 40px 40px,
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px) 0 0 / 40px 40px,
            #1A1A2E;
          touch-action: none;
        }
        .viewport-hint {
          position: absolute;
          bottom: 12px;
          left: 16px;
          padding: 5px 12px;
          font-size: 11px;
          font-family: 'Outfit', monospace;
          color: rgba(255, 255, 255, 0.35);
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          pointer-events: none;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
