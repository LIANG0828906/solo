import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from 'react';
import type { DrawPath, Point, StickyNote as NoteT, ToolbarState } from './types';
import StickyNote from './StickyNote';
import { clamp, easeInOutCubic } from './utils';

interface CanvasProps {
  paths: DrawPath[];
  notes: NoteT[];
  toolbar: ToolbarState;
  currentUserId: string;
  clearProgress: number;
  onDrawStart: (path: DrawPath) => void;
  onDrawPoint: (pathId: string, point: Point) => void;
  onDrawEnd: (pathId: string) => void;
  onNoteUpdate: (noteId: string, partial: Partial<NoteT>) => void;
}

export interface CanvasHandle {
  requestRender: () => void;
}

const APPEAR_DURATION = 2000;
const ERASE_DURATION = 350;
const DRAW_REDO_DURATION = 350;

const Canvas = forwardRef<CanvasHandle, CanvasProps>((props, ref) => {
  const {
    paths,
    notes,
    toolbar,
    currentUserId,
    clearProgress,
    onDrawStart,
    onDrawPoint,
    onDrawEnd,
    onNoteUpdate,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const dprRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const pathsRef = useRef<DrawPath[]>(paths);
  const drawingRef = useRef<{
    active: boolean;
    pathId: string | null;
    lastSentAt: number;
    pendingPoint: Point | null;
  }>({
    active: false,
    pathId: null,
    lastSentAt: 0,
    pendingPoint: null,
  });
  const activeTouchesRef = useRef<Map<number, { pathId: string; lastPt: Point }>>(new Map());
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  const applyPixelRatio = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = bgCanvasRef.current;
    bg.width = Math.floor(w * dpr);
    bg.height = Math.floor(h * dpr);
    bg.style.width = `${w}px`;
    bg.style.height = `${h}px`;
    drawLinenBackground(bg, w, h, dpr);
  }, []);

  const drawLinenBackground = (c: HTMLCanvasElement, w: number, h: number, dpr: number) => {
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const base = '#e8e4d7';
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#eee9da');
    g.addColorStop(0.5, base);
    g.addColorStop(1, '#e3ddd0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#6b5d3d';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 2) {
      const off = (Math.sin(y * 0.02) + Math.cos(y * 0.013)) * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, y + off);
      ctx.lineTo(w, y + off * 0.5);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += 2) {
      const off = (Math.sin(x * 0.03) + Math.cos(x * 0.017)) * 0.5;
      ctx.beginPath();
      ctx.moveTo(x + off, 0);
      ctx.lineTo(x + off * 0.4, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.015;
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#3d2a0b' : '#fff';
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = Math.random() * 1.2 + 0.3;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;

    const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(60, 40, 10, 0.12)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  };

  const getLocalPoint = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const jitterPoint = (p: Point, thickness: number): Point => {
    return {
      x: p.x,
      y: p.y,
      jitterX: (Math.random() - 0.5) * thickness * 0.32,
      jitterY: (Math.random() - 0.5) * thickness * 0.32,
    };
  };

  const startDraw = (pt: Point, pathId?: string) => {
    const id = pathId || crypto.randomUUID();
    const newPath: DrawPath = {
      id,
      type: 'path',
      userId: currentUserId,
      color: toolbar.activeColor,
      thickness: toolbar.thickness,
      points: [jitterPoint(pt, toolbar.thickness)],
      createdAt: performance.now(),
      isDrawing: true,
      animationState: {
        kind: 'appearing',
        progress: 0,
        startTime: performance.now(),
      },
    };
    drawingRef.current.active = true;
    drawingRef.current.pathId = id;
    drawingRef.current.lastSentAt = performance.now();
    drawingRef.current.pendingPoint = null;
    onDrawStart(newPath);
  };

  const continueDraw = (pt: Point) => {
    const dr = drawingRef.current;
    if (!dr.active || !dr.pathId) return;
    const jp = jitterPoint(pt, toolbar.thickness);

    const now = performance.now();
    if (now - dr.lastSentAt >= 15) {
      if (dr.pendingPoint) {
        onDrawPoint(dr.pathId, dr.pendingPoint);
      }
      onDrawPoint(dr.pathId, jp);
      dr.lastSentAt = now;
      dr.pendingPoint = null;
    } else {
      dr.pendingPoint = jp;
    }
    onDrawPoint(dr.pathId, jp);
  };

  const endDraw = () => {
    const dr = drawingRef.current;
    if (!dr.active || !dr.pathId) return;
    if (dr.pendingPoint) {
      onDrawPoint(dr.pathId, dr.pendingPoint);
      dr.pendingPoint = null;
    }
    const pathId = dr.pathId;
    dr.active = false;
    dr.pathId = null;
    onDrawEnd(pathId);
  };

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (toolbar.activeTool !== 'pen') return;
      const pt = getLocalPoint(e.clientX, e.clientY);
      startDraw(pt);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!drawingRef.current.active) return;
      const pt = getLocalPoint(e.clientX, e.clientY);
      continueDraw(pt);
    };
    const onMouseUp = () => endDraw();
    const onMouseLeave = () => endDraw();

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbar.activeColor, toolbar.thickness, toolbar.activeTool, currentUserId]);

  // Touch handlers (multi-touch support, first touch is pen)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      if (toolbar.activeTool !== 'pen') return;
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const pt = getLocalPoint(t.clientX, t.clientY);
        if (activeTouchesRef.current.size === 0) {
          const id = crypto.randomUUID();
          startDraw(pt, id);
          activeTouchesRef.current.set(t.identifier, { pathId: id, lastPt: pt });
        } else {
          const first = activeTouchesRef.current.values().next().value;
          if (first) {
            activeTouchesRef.current.set(t.identifier, { pathId: first.pathId, lastPt: pt });
          }
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const data = activeTouchesRef.current.get(t.identifier);
        if (data) {
          const pt = getLocalPoint(t.clientX, t.clientY);
          const dx = Math.abs(pt.x - data.lastPt.x);
          const dy = Math.abs(pt.y - data.lastPt.y);
          if (dx > 0.4 || dy > 0.4) {
            continueDraw(pt);
            data.lastPt = pt;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        activeTouchesRef.current.delete(t.identifier);
      }
      if (activeTouchesRef.current.size === 0) {
        endDraw();
      }
    };

    const opts: AddEventListenerOptions = { passive: false };
    canvas.addEventListener('touchstart', onTouchStart, opts);
    canvas.addEventListener('touchmove', onTouchMove, opts);
    canvas.addEventListener('touchend', onTouchEnd, opts);
    canvas.addEventListener('touchcancel', onTouchEnd, opts);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbar.activeColor, toolbar.thickness, toolbar.activeTool, currentUserId]);

  // Resize observer
  useEffect(() => {
    applyPixelRatio();
    const ro = new ResizeObserver(() => {
      applyPixelRatio();
      forceUpdate();
    });
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('orientationchange', applyPixelRatio);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', applyPixelRatio);
    };
  }, [applyPixelRatio, forceUpdate]);

  // Render loop
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const bg = bgCanvasRef.current;
      if (!canvas || !container || !bg) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const w = container.clientWidth;
      const h = container.clientHeight;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, w, h);

      const now = performance.now();
      const currentPaths = pathsRef.current;

      for (const path of currentPaths) {
        if (path.points.length < 1) continue;

        let opacity = 1;
        let clipProgress = 1;

        // Appearing animation
        if (!path.animationState || path.animationState.kind === 'appearing') {
          const start = path.animationState?.startTime ?? path.createdAt;
          const p = clamp((now - start) / APPEAR_DURATION, 0, 1);
          opacity = 0.18 + p * 0.82;
        }

        // Erasing animation (undo)
        if (path.animationState?.kind === 'erasing') {
          const p = clamp((now - path.animationState.startTime) / ERASE_DURATION, 0, 1);
          const eased = easeInOutCubic(p);
          opacity = 1 - eased;
          clipProgress = 1 - eased;
        }

        // Redrawing animation (redo)
        if (path.animationState?.kind === 'redrawing') {
          const p = clamp((now - path.animationState.startTime) / DRAW_REDO_DURATION, 0, 1);
          const eased = easeInOutCubic(p);
          opacity = eased;
          clipProgress = eased;
        }

        if (opacity <= 0.001) continue;

        const isRemote = path.userId !== currentUserId;
        const drawColor = isRemote ? '#6b7280' : path.color;
        let finalOpacity = opacity;
        if (isRemote && path.isDrawing) finalOpacity *= 0.5;

        ctx.save();
        ctx.globalAlpha = finalOpacity;
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = path.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Compute total length and clip to clipProgress
        const pts = path.points;
        let totalLength = 0;
        const segLens: number[] = [];
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i - 1].x;
          const dy = pts[i].y - pts[i - 1].y;
          const l = Math.sqrt(dx * dx + dy * dy);
          segLens.push(l);
          totalLength += l;
        }
        const targetLen = totalLength * clipProgress;

        ctx.beginPath();
        let acc = 0;
        let moved = false;
        for (let i = 0; i < pts.length; i++) {
          if (i === 0) {
            const p0 = pts[0];
            const x0 = p0.x + (p0.jitterX ?? 0);
            const y0 = p0.y + (p0.jitterY ?? 0);
            ctx.moveTo(x0, y0);
            moved = true;
            continue;
          }
          const segLen = segLens[i - 1] ?? 0;
          if (acc + segLen > targetLen) {
            const remain = targetLen - acc;
            if (remain <= 0) break;
            const ratio = remain / segLen;
            const prev = pts[i - 1];
            const curr = pts[i];
            const prevX = prev.x + (prev.jitterX ?? 0);
            const prevY = prev.y + (prev.jitterY ?? 0);
            const currX = curr.x + (curr.jitterX ?? 0);
            const currY = curr.y + (curr.jitterY ?? 0);
            const cx = prevX + (currX - prevX) * 0.5;
            const cy = prevY + (currY - prevY) * 0.5;
            const endX = prevX + (currX - prevX) * ratio;
            const endY = prevY + (currY - prevY) * ratio;
            const midX = prevX + (cx - prevX) * ratio;
            const midY = prevY + (cy - prevY) * ratio;
            ctx.quadraticCurveTo(midX, midY, endX, endY);
            break;
          } else {
            const prev = pts[i - 1];
            const curr = pts[i];
            const prevX = prev.x + (prev.jitterX ?? 0);
            const prevY = prev.y + (prev.jitterY ?? 0);
            const currX = curr.x + (curr.jitterX ?? 0);
            const currY = curr.y + (curr.jitterY ?? 0);
            const cpx = prevX + (currX - prevX) * 0.5;
            const cpy = prevY + (currY - prevY) * 0.5;
            if (!moved) {
              ctx.moveTo(prevX, prevY);
              moved = true;
            }
            ctx.quadraticCurveTo(prevX, prevY, cpx, cpy);
            if (i === pts.length - 1 && clipProgress >= 1) {
              ctx.quadraticCurveTo(cpx, cpy, currX, currY);
            }
            acc += segLen;
          }
        }
        ctx.stroke();

        // Double stroke for subtle texture on thick lines
        if (path.thickness >= 5) {
          ctx.globalAlpha = finalOpacity * 0.35;
          ctx.lineWidth = path.thickness * 0.55;
          ctx.strokeStyle = isRemote ? '#4b5563' : path.color;
          ctx.stroke();
        }

        ctx.restore();
      }

      // Clear animation (circular mask overlay)
      if (clearProgress > 0 && clearProgress < 1) {
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.sqrt(cx * cx + cy * cy);
        const r = maxR * easeInOutCubic(clearProgress);

        ctx.save();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.arc(cx, cy, Math.max(0, r - 2), 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill('evenodd');

        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.25;
        const ringGrad = ctx.createRadialGradient(cx, cy, Math.max(0, r - 20), cx, cy, r);
        ringGrad.addColorStop(0, 'rgba(233, 69, 96, 0)');
        ringGrad.addColorStop(0.7, 'rgba(233, 69, 96, 0.4)');
        ringGrad.addColorStop(1, 'rgba(233, 69, 96, 0)');
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (clearProgress >= 1) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentUserId, clearProgress]);

  useImperativeHandle(
    ref,
    () => ({
      requestRender: forceUpdate,
    }),
    [forceUpdate],
  );

  return (
    <div ref={containerRef} className="canvas-container" style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} className="board-canvas" style={{ position: 'absolute', inset: 0, cursor: toolbar.activeTool === 'pen' ? 'crosshair' : 'default' }} />
      <div className="notes-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {notes.map((note) => (
          <div key={note.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
            <StickyNote
              note={note}
              onUpdate={(partial) => onNoteUpdate(note.id, partial)}
              isOwner={note.userId === currentUserId}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
