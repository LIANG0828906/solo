import React, { useEffect, useRef } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { formatDate } from '@/utils/dateUtils';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;
const NODE_GAP = 240;
const NODE_START_X = 100;
const NODE_RADIUS = 12;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const LERP = 0.1;

const getNodePosition = (idx: number, scale: number, offsetX: number) => {
  const x = NODE_START_X + idx * NODE_GAP;
  return { x, y: 0 };
};

const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const TimelineCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const dprRef = useRef<number>(1);
  const offsetXRef = useRef<number>(0);
  const offsetYRef = useRef<number>(0);
  const scaleRef = useRef<number>(1);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number }>({
    x: 0,
    y: 0,
    ox: 0,
    oy: 0,
  });

  const nodes = useTimelineStore((s) => s.nodes);
  const edges = useTimelineStore((s) => s.edges);
  const playingIndex = useTimelineStore((s) => s.playingIndex);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const getCanvasPoint = (e: MouseEvent | WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      const p = getCanvasPoint(e);
      dragStartRef.current = {
        x: p.x,
        y: p.y,
        ox: offsetXRef.current,
        oy: offsetYRef.current,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const p = getCanvasPoint(e);
      offsetXRef.current = dragStartRef.current.ox + (p.x - dragStartRef.current.x);
      offsetYRef.current = dragStartRef.current.oy + (p.y - dragStartRef.current.y);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = getCanvasPoint(e);
      const oldScale = scaleRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      let newScale = oldScale * factor;
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      const worldX = (p.x - offsetXRef.current) / oldScale;
      offsetXRef.current = p.x - worldX * newScale;
      scaleRef.current = newScale;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    const render = () => {
      const rect = container.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      const scale = scaleRef.current;
      const dpr = dprRef.current;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cw, ch);

      const bg = ctx.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, '#1a1a2e');
      bg.addColorStop(1, '#16213e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);

      const totalW = NODE_START_X + nodes.length * NODE_GAP;
      const maxOffsetX = cw - totalW * scale - 50;
      const minOffsetX = 50;

      if (offsetXRef.current > minOffsetX) {
        offsetXRef.current = offsetXRef.current + (minOffsetX - offsetXRef.current) * LERP;
      } else if (offsetXRef.current < maxOffsetX) {
        offsetXRef.current = offsetXRef.current + (maxOffsetX - offsetXRef.current) * LERP;
      }

      if (totalW * scale < cw) {
        const target = (cw - totalW * scale) / 2;
        offsetXRef.current = offsetXRef.current + (target - offsetXRef.current) * LERP;
      }

      const offsetX = offsetXRef.current;
      const baselineY = ch / 2;

      ctx.save();
      ctx.translate(offsetX, 0);
      ctx.scale(scale, 1);

      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      const drawStartX = -offsetX / scale - 100;
      const drawEndX = (cw - offsetX) / scale + 100;
      ctx.moveTo(drawStartX, baselineY);
      ctx.lineTo(drawEndX, baselineY);
      ctx.stroke();

      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const srcIdx = edge.source;
        const tgtIdx = edge.target;
        if (srcIdx < 0 || srcIdx >= nodes.length || tgtIdx < 0 || tgtIdx >= nodes.length) continue;
        const srcPos = getNodePosition(srcIdx, scale, offsetX);
        const tgtPos = getNodePosition(tgtIdx, scale, offsetX);
        const x1 = srcPos.x + NODE_WIDTH;
        const y1 = baselineY;
        const x2 = tgtPos.x;
        const y2 = baselineY;
        const cp1x = x1 + 40;
        const cp1y = y1;
        const cp2x = x2 - 40;
        const cp2y = y2;
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1.5 / scale;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        ctx.stroke();
      }

      const t = performance.now() / 1000;
      const glowRadius = 4 + 4 * Math.abs(Math.sin(2 * Math.PI * 1 * t));

      const drawNode = (idx: number, withGlow: boolean) => {
        const node = nodes[idx];
        const pos = getNodePosition(idx, scale, offsetX);
        const nx = pos.x;
        const ny = baselineY - NODE_HEIGHT / 2;

        if (withGlow) {
          ctx.save();
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = glowRadius / scale;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = node.color;
          drawRoundRect(ctx, nx, ny, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = node.color;
        drawRoundRect(ctx, nx, ny, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let title = node.title || '';
        if (title.length > 16) title = title.slice(0, 16);
        ctx.font = `bold ${13 / scale}px sans-serif`;
        ctx.fillText(title, nx + NODE_WIDTH / 2, ny + NODE_HEIGHT / 2 - 10 / scale);

        const dateStr = formatDate(node.date);
        ctx.font = `${11 / scale}px sans-serif`;
        ctx.fillText(dateStr, nx + NODE_WIDTH / 2, ny + NODE_HEIGHT / 2 + 12 / scale);
      };

      for (let i = 0; i < nodes.length; i++) {
        if (i === playingIndex) continue;
        drawNode(i, false);
      }

      if (playingIndex >= 0 && playingIndex < nodes.length) {
        drawNode(playingIndex, true);
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [nodes, edges, playingIndex]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
        }}
      />
    </div>
  );
};

export default TimelineCanvas;
