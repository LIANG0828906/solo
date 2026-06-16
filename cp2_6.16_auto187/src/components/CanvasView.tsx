import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useLayerStore } from '../store/layerStore';
import { Layer, drawAllLayers } from '../utils/layerUtils';
import './CanvasView.css';

const CANVAS_W = 1600;
const CANVAS_H = 900;

interface OffscreenBuffers {
  original: HTMLCanvasElement | null;
  current: HTMLCanvasElement | null;
  originalDrawnKey: string;
  currentDrawnKey: string;
}

const CanvasView: React.FC = () => {
  const layers = useLayerStore(state => state.layers);
  const compareMode = useLayerStore(state => state.compareMode);
  const splitPosition = useLayerStore(state => state.splitPosition);
  const setSplitPosition = useLayerStore(state => state.setSplitPosition);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const buffersRef = useRef<OffscreenBuffers>({
    original: null,
    current: null,
    originalDrawnKey: '',
    currentDrawnKey: '',
  });

  useEffect(() => {
    buffersRef.current.original = document.createElement('canvas');
    buffersRef.current.original.width = CANVAS_W;
    buffersRef.current.original.height = CANVAS_H;
    buffersRef.current.current = document.createElement('canvas');
    buffersRef.current.current.width = CANVAS_W;
    buffersRef.current.current.height = CANVAS_H;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setFadeKey(k => k + 1), 10);
    return () => clearTimeout(t);
  }, [compareMode]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 48;
      const availW = rect.width - padding * 2;
      const availH = rect.height - padding * 2;
      const ratio = CANVAS_W / CANVAS_H;
      let w = availW;
      let h = w / ratio;
      if (h > availH) {
        h = availH;
        w = h * ratio;
      }
      setCanvasSize({ w: Math.floor(w), h: Math.floor(h) });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const originalKey = useMemo(
    () => layers.map(l => `${l.id}:${l.elements.length}`).join('|'),
    [layers],
  );
  const currentKey = useMemo(
    () => layers.map(l => `${l.id}:${l.visible}:${l.elements.length}`).join('|'),
    [layers],
  );

  const ensureBuffers = useCallback(
    (currentLayers: Layer[], curKey: string, origKey: string) => {
      const buffers = buffersRef.current;
      if (!buffers.original || !buffers.current) return;
      if (buffers.originalDrawnKey !== origKey) {
        const octx = buffers.original.getContext('2d');
        if (octx) {
          drawAllLayers(octx, currentLayers, CANVAS_W, CANVAS_H, true);
        }
        buffers.originalDrawnKey = origKey;
      }
      if (buffers.currentDrawnKey !== curKey) {
        const cctx = buffers.current.getContext('2d');
        if (cctx) {
          drawAllLayers(cctx, currentLayers, CANVAS_W, CANVAS_H, false);
        }
        buffers.currentDrawnKey = curKey;
      }
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.w === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ensureBuffers(layers, currentKey, originalKey);
    const buffers = buffersRef.current;
    if (!buffers.original || !buffers.current) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    const draw = (source: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => {
      ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    };

    if (compareMode) {
      const splitPx = canvasSize.w * splitPosition;
      if (splitPx > 1) {
        draw(
          buffers.original,
          0, 0, CANVAS_W * splitPosition, CANVAS_H,
          0, 0, splitPx, canvasSize.h,
        );
      }
      if (canvasSize.w - splitPx > 1) {
        const remainRatio = 1 - splitPosition;
        draw(
          buffers.current,
          CANVAS_W * splitPosition, 0, CANVAS_W * remainRatio, CANVAS_H,
          splitPx, 0, canvasSize.w - splitPx, canvasSize.h,
        );
      }

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(splitPx + 0.5, 0);
      ctx.lineTo(splitPx + 0.5, canvasSize.h);
      ctx.stroke();
    } else {
      draw(
        buffers.current,
        0, 0, CANVAS_W, CANVAS_H,
        0, 0, canvasSize.w, canvasSize.h,
      );
    }
    ctx.restore();
  }, [canvasSize, layers, compareMode, splitPosition, currentKey, originalKey, ensureBuffers]);

  const getSplitX = useCallback((clientX: number) => {
    if (!containerRef.current) return splitPosition;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 48;
    const leftPad = (rect.width - canvasSize.w) / 2;
    if (canvasSize.w === 0) return splitPosition;
    const x = (clientX - rect.left - leftPad) / canvasSize.w;
    return Math.max(0.05, Math.min(0.95, x));
  }, [canvasSize.w, splitPosition]);

  useEffect(() => {
    if (!isDraggingSplit) return;
    let rafId = 0;
    let pendingX: number | null = null;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      pendingX = clientX;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (pendingX !== null) {
            setSplitPosition(getSplitX(pendingX));
          }
          rafId = 0;
        });
      }
    };
    const onUp = () => {
      setIsDraggingSplit(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isDraggingSplit, getSplitX, setSplitPosition]);

  return (
    <div ref={containerRef} className="lp-canvas-container">
      <div
        key={fadeKey}
        className={`lp-canvas-wrapper ${compareMode ? 'lp-compare-mode' : ''}`}
        style={{ width: canvasSize.w, height: canvasSize.h }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: canvasSize.w,
            height: canvasSize.h,
            display: canvasSize.w ? 'block' : 'none',
          }}
          className="lp-main-canvas"
        />
        {compareMode && canvasSize.w > 0 && (
          <>
            <div className="lp-compare-label lp-label-left">原始</div>
            <div className="lp-compare-label lp-label-right">当前</div>
            <div
              className={`lp-split-handle ${isDraggingSplit ? 'lp-handle-dragging' : ''}`}
              style={{
                left: `calc(50% - ${canvasSize.w / 2}px + ${canvasSize.w * splitPosition}px - 14px)`,
                top: '50%',
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingSplit(true);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                setIsDraggingSplit(true);
              }}
            >
              <div className="lp-handle-grip" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CanvasView;
