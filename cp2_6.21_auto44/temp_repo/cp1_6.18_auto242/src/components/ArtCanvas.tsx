import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { Particle, BrushConfig, DrawPoint, DrawCommand } from '@/types';
import { emitDrawParticles, updateParticles, renderParticles } from '@/services/fluidSimulator';

export interface ArtCanvasHandle {
  exportFullImage: () => string;
  exportThumbnail: (w: number, h: number) => string;
  getDrawSequence: () => DrawPoint[];
  clearCanvas: () => void;
  startPlaybackSequence: (seq: DrawPoint[], onComplete?: () => void) => void;
  stopPlayback: () => void;
  getCanvasSize: () => { width: number; height: number };
}

interface ArtCanvasProps {
  brushConfig: BrushConfig;
  disabled?: boolean;
  onDrawStart?: () => void;
  onDrawEnd?: (hasContent: boolean) => void;
  playbackProgress?: number;
  onPlaybackProgress?: (progress: number) => void;
}

export const ArtCanvas = forwardRef<ArtCanvasHandle, ArtCanvasProps>(function ArtCanvas(
  { brushConfig, disabled, onDrawStart, onDrawEnd, onPlaybackProgress },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const brushCfgRef = useRef(brushConfig);
  const disabledRef = useRef(!!disabled);
  const animRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef(0);
  const drawStartTimeRef = useRef(0);
  const drawSequenceRef = useRef<DrawPoint[]>([]);
  const hasDrawnRef = useRef(false);

  const playbackRef = useRef<{
    seq: DrawPoint[];
    startTime: number;
    cursor: number;
    running: boolean;
    onComplete?: () => void;
    duration: number;
  } | null>(null);

  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    brushCfgRef.current = brushConfig;
  }, [brushConfig]);

  useEffect(() => {
    disabledRef.current = !!disabled;
  }, [disabled]);

  useImperativeHandle(ref, () => ({
    exportFullImage: () => {
      const c = canvasRef.current!;
      return c.toDataURL('image/png');
    },
    exportThumbnail: (w, h) => {
      const src = canvasRef.current!;
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d')!;
      octx.fillStyle = '#08080d';
      octx.fillRect(0, 0, w, h);
      octx.drawImage(src, 0, 0, src.width, src.height, 0, 0, w, h);
      return off.toDataURL('image/png', 0.75);
    },
    getDrawSequence: () => [...drawSequenceRef.current],
    clearCanvas: () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        const { width, height } = sizeRef.current;
        ctx.fillStyle = '#08080d';
        ctx.fillRect(0, 0, width, height);
      }
      particlesRef.current = [];
      drawSequenceRef.current = [];
      hasDrawnRef.current = false;
    },
    startPlaybackSequence: (seq, onComplete) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d')!;
      const { width, height } = sizeRef.current;
      ctx.fillStyle = '#08080d';
      ctx.fillRect(0, 0, width, height);
      particlesRef.current = [];
      playbackRef.current = {
        seq,
        startTime: performance.now(),
        cursor: 0,
        running: true,
        onComplete,
        duration: seq.length > 0 ? seq[seq.length - 1].timestamp + 5500 : 5000,
      };
    },
    stopPlayback: () => {
      if (playbackRef.current) {
        playbackRef.current.running = false;
        playbackRef.current.onComplete?.();
        playbackRef.current = null;
      }
    },
    getCanvasSize: () => ({ width: sizeRef.current.width, height: sizeRef.current.height }),
  }));

  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;

    const resize = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const rect = container.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width));
      const h = Math.max(200, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width: w, height: h, dpr };
      ctx.fillStyle = '#08080d';
      ctx.fillRect(0, 0, w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const loop = (ts: number) => {
      const last = lastFrameTsRef.current || ts;
      const dt = Math.min(64, ts - last);
      lastFrameTsRef.current = ts;

      const ctx = canvas.getContext('2d')!;
      const { width, height } = sizeRef.current;

      const pb = playbackRef.current;
      if (pb && pb.running) {
        const elapsed = ts - pb.startTime;
        while (pb.cursor < pb.seq.length && pb.seq[pb.cursor].timestamp <= elapsed) {
          const pt = pb.seq[pb.cursor];
          const absX = pt.x * width;
          const absY = pt.y * height;
          const prev = pb.cursor > 0 ? pb.seq[pb.cursor - 1] : null;
          const prevX = prev ? prev.x * width : absX;
          const prevY = prev ? prev.y * height : absY;
          const cmd: DrawCommand = {
            x: absX,
            y: absY,
            prevX,
            prevY,
            pressure: pt.pressure,
            brushConfig: pt.brushConfig,
          };
          emitDrawParticles(cmd, particlesRef.current.length, particlesRef.current);
          pb.cursor++;
        }
        const progress = Math.min(1, elapsed / Math.max(1, pb.duration));
        onPlaybackProgress?.(progress);
        if (elapsed >= pb.duration) {
          pb.running = false;
          pb.onComplete?.();
          playbackRef.current = null;
        }
      }

      particlesRef.current = updateParticles(
        particlesRef.current,
        dt,
        brushCfgRef.current.brushStyle,
        brushCfgRef.current.diffusionSpeed,
        width,
        height
      );
      renderParticles(ctx, particlesRef.current, width, height);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, [onPlaybackProgress]);

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabledRef.current || playbackRef.current?.running) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getPos(e);
    lastPosRef.current = p;
    drawStartTimeRef.current = performance.now();
    drawSequenceRef.current = [];
    hasDrawnRef.current = true;
    recordPoint(p, p);
    onDrawStart?.();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const p = getPos(e);
    const last = lastPosRef.current!;
    const dist = Math.hypot(p.x - last.x, p.y - last.y);
    if (dist < 0.5) return;
    const pressure = Math.min(1, dist / 60);
    const { width, height } = sizeRef.current;
    const cmd: DrawCommand = {
      x: p.x, y: p.y,
      prevX: last.x, prevY: last.y,
      pressure,
      brushConfig: { ...brushCfgRef.current },
    };
    emitDrawParticles(cmd, particlesRef.current.length, particlesRef.current);
    recordPoint(p, last, pressure);
    lastPosRef.current = p;
  };

  const recordPoint = (p: { x: number; y: number }, prev: { x: number; y: number }, pressure = 0) => {
    const { width, height } = sizeRef.current;
    const t = performance.now() - drawStartTimeRef.current;
    drawSequenceRef.current.push({
      x: width > 0 ? p.x / width : 0,
      y: height > 0 ? p.y / height : 0,
      pressure,
      timestamp: t,
      brushConfig: { ...brushCfgRef.current },
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPosRef.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
    onDrawEnd?.(hasDrawnRef.current);
  };

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="main-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div className="canvas-vignette" />
    </div>
  );
});
