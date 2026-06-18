import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMixStore } from '../store';
import { getBandColor } from '../waveformRenderer';
import { getTrackMixPositions, computeTotalDuration, formatTime } from '../audioMixer';
import type { MixPosition } from '../audioMixer';

const CANVAS_W = 900;
const CANVAS_H = 160;
const PAD_X = 20;
const PAD_TOP = 28;
const ROW_TOP = 48;
const ROW_H = 92;

interface Block {
  id: string;
  x: number;
  w: number;
  color: string;
  trackName: string;
  bpm: number | null;
  pos: MixPosition;
  dur: number;
}

export function MixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    tracks, trackOrder, crossfadeDuration, reorderTracks, currentPlayTime,
  } = useMixStore();

  const [dragging, setDragging] = useState<{ id: string | null; offsetX: number; pointerId: number | null }>({
    id: null, offsetX: 0, pointerId: null,
  });
  const [ghostX, setGhostX] = useState<number | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const orderedTracks = useMemo(
    () => trackOrder.map(id => tracks.find(t => t.id === id)!).filter(Boolean),
    [tracks, trackOrder]
  );

  const totalDuration = useMemo(
    () => computeTotalDuration(tracks, trackOrder, crossfadeDuration),
    [tracks, trackOrder, crossfadeDuration]
  );

  const blocks: Block[] = useMemo(() => {
    const result: Block[] = [];
    if (totalDuration <= 0) return result;
    const contentW = CANVAS_W - PAD_X * 2;
    const positions = getTrackMixPositions(tracks, trackOrder, crossfadeDuration);
    for (let i = 0; i < orderedTracks.length; i++) {
      const t = orderedTracks[i];
      const pos = positions.get(t.id);
      if (!pos) continue;
      const x = PAD_X + (pos.globalStart / totalDuration) * contentW;
      const endX = PAD_X + (pos.globalEnd / totalDuration) * contentW;
      const w = Math.max(20, endX - x);
      result.push({
        id: t.id,
        x, w,
        color: getBandColor(t.dominantBand),
        trackName: t.name,
        bpm: t.bpm,
        pos,
        dur: t.duration,
      });
    }
    return result;
  }, [orderedTracks, tracks, trackOrder, crossfadeDuration, totalDuration]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = PAD_X + (i / 10) * (CANVAS_W - PAD_X * 2);
      ctx.beginPath();
      ctx.moveTo(x, ROW_TOP);
      ctx.lineTo(x, ROW_TOP + ROW_H);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD_X, ROW_TOP);
    ctx.lineTo(CANVAS_W - PAD_X, ROW_TOP);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD_X, ROW_TOP + ROW_H);
    ctx.lineTo(CANVAS_W - PAD_X, ROW_TOP + ROW_H);
    ctx.stroke();

    if (blocks.length === 0) {
      ctx.fillStyle = 'rgba(152,152,176,0.5)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('添加至少 2 个音频后，可在此拖拽调整顺序', CANVAS_W / 2, CANVAS_H / 2);
    }

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const isGhost = dragging.id === b.id && ghostX !== null;
      const drawX = isGhost ? (ghostX as number) : b.x;
      const drawW = b.w;

      if (i < blocks.length - 1) {
        const next = blocks[i + 1];
        const fadeW = Math.max(2, (crossfadeDuration / totalDuration) * (CANVAS_W - PAD_X * 2));
        const fx = b.x + b.w - fadeW;
        const grad = ctx.createLinearGradient(fx, 0, fx + fadeW, 0);
        grad.addColorStop(0, `${b.color}55`);
        grad.addColorStop(0.5, '#ffffff22');
        grad.addColorStop(1, `${next.color}55`);
        ctx.fillStyle = grad;
        ctx.fillRect(fx, ROW_TOP + 4, fadeW, ROW_H - 8);
        ctx.strokeStyle = 'rgba(0,255,136,0.45)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx, ROW_TOP + 2);
        ctx.lineTo(fx, ROW_TOP + ROW_H - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx + fadeW, ROW_TOP + 2);
        ctx.lineTo(fx + fadeW, ROW_TOP + ROW_H - 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const pad = 2;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(drawX + pad, ROW_TOP + pad, drawW - pad * 2, ROW_H - pad * 2);

      const blockGrad = ctx.createLinearGradient(drawX, ROW_TOP, drawX, ROW_TOP + ROW_H);
      blockGrad.addColorStop(0, b.color);
      blockGrad.addColorStop(1, `${b.color}88`);
      ctx.fillStyle = isGhost ? blockGrad : `color-mix(in srgb, ${b.color} 85%, #1A1A2E)`;
      if (!CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')) {
        ctx.fillStyle = blockGrad;
        ctx.globalAlpha = isGhost ? 0.9 : 0.85;
      }
      roundRect(ctx, drawX + pad, ROW_TOP + pad, drawW - pad * 2, ROW_H - pad * 2, 8);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = `${b.color}cc`;
      ctx.lineWidth = 1.2;
      roundRect(ctx, drawX + pad, ROW_TOP + pad, drawW - pad * 2, ROW_H - pad * 2, 8);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '600 12px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const textX = drawX + 10;
      const textW = drawW - 20;
      if (textW > 20) {
        const label = truncate(ctx, b.trackName, textW);
        ctx.fillText(label, textX, ROW_TOP + 12);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '11px "SF Mono", Menlo, monospace';
      const meta = [
        b.bpm ? `${b.bpm} BPM` : '',
        formatTime(b.dur),
      ].filter(Boolean).join(' · ');
      if (textW > 30 && meta) {
        const metaTrunc = truncate(ctx, meta, textW);
        ctx.fillText(metaTrunc, textX, ROW_TOP + 32);
      }
    }

    if (insertIndex !== null && dragging.id) {
      const contentW = CANVAS_W - PAD_X * 2;
      const positions = getTrackMixPositions(tracks, trackOrder, crossfadeDuration);
      let x: number;
      if (insertIndex === 0) {
        x = PAD_X;
      } else if (insertIndex >= blocks.length) {
        x = CANVAS_W - PAD_X;
      } else {
        const prev = blocks[insertIndex - 1];
        const curr = blocks[insertIndex];
        x = (prev.x + prev.w + curr.x) / 2;
        void positions;
      }
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x, ROW_TOP - 4);
      ctx.lineTo(x, ROW_TOP + ROW_H + 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#00FF88';
      ctx.beginPath();
      ctx.arc(x, ROW_TOP - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, ROW_TOP + ROW_H + 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (totalDuration > 0) {
      const t = Math.min(Math.max(0, currentPlayTime), totalDuration);
      const px = PAD_X + (t / totalDuration) * (CANVAS_W - PAD_X * 2);
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0,230,118,0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(px, 10);
      ctx.lineTo(px, ROW_TOP + ROW_H + 12);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#00E676';
      ctx.beginPath();
      ctx.moveTo(px - 6, 4);
      ctx.lineTo(px + 6, 4);
      ctx.lineTo(px, 14);
      ctx.closePath();
      ctx.fill();
    }

    if (totalDuration > 0) {
      ctx.fillStyle = 'rgba(96,96,128,0.85)';
      ctx.font = '10px "SF Mono", Menlo, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      for (let i = 0; i <= 4; i++) {
        const t = (i / 4) * totalDuration;
        const x = PAD_X + (i / 4) * (CANVAS_W - PAD_X * 2);
        ctx.fillText(formatTime(t), x - 14, ROW_TOP + ROW_H + 16);
      }
    }
  }, [blocks, dragging, ghostX, insertIndex, totalDuration, currentPlayTime, crossfadeDuration, tracks, trackOrder]);

  useEffect(() => {
    draw();
  }, [draw]);

  const pointToBlockIndex = (px: number): number => {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (px >= b.x && px <= b.x + b.w) return i;
    }
    return -1;
  };

  const computeInsertIndex = (px: number, draggedId: string): number => {
    const others = blocks.filter(b => b.id !== draggedId);
    for (let i = 0; i < others.length; i++) {
      const b = others[i];
      if (px < b.x + b.w / 2) return trackOrder.indexOf(b.id);
    }
    const lastId = others.length > 0 ? others[others.length - 1].id : null;
    if (lastId === null) return 0;
    return trackOrder.indexOf(lastId) + 1;
  };

  const clientToCanvasX = (e: React.PointerEvent): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * CANVAS_W;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (blocks.length < 2) return;
    const x = clientToCanvasX(e);
    const idx = pointToBlockIndex(x);
    if (idx < 0) return;
    const b = blocks[idx];
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging({ id: b.id, offsetX: x - b.x, pointerId: e.pointerId });
    setGhostX(b.x);
    setInsertIndex(idx);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.id) return;
    const x = clientToCanvasX(e);
    const gx = Math.max(PAD_X - 5, Math.min(CANVAS_W - PAD_X + 5, x - dragging.offsetX));
    setGhostX(gx);
    setInsertIndex(computeInsertIndex(x, dragging.id));
  };

  const endDrag = () => {
    if (!dragging.id) return;
    const draggedId = dragging.id;
    const newIndex = insertIndex;
    if (newIndex !== null) {
      const order = [...trackOrder];
      const from = order.indexOf(draggedId);
      if (from >= 0) {
        order.splice(from, 1);
        let to = newIndex;
        if (to > from) to -= 1;
        order.splice(to, 0, draggedId);
        reorderTracks(order);
      }
    }
    setDragging({ id: null, offsetX: 0, pointerId: null });
    setGhostX(null);
    setInsertIndex(null);
  };

  const onPointerUp = () => endDrag();
  const onPointerCancel = () => endDrag();

  return (
    <div className="canvas-wrap">
      <span className="drag-hint">
        {blocks.length >= 2 ? '提示：拖拽彩色方块可调整拼接顺序' : ''}
      </span>
      <canvas
        ref={canvasRef}
        className="mix-canvas"
        style={{ touchAction: 'none', cursor: blocks.length >= 2 ? (dragging.id ? 'grabbing' : 'grab') : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length;
  let best = '';
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = text.slice(0, mid) + '…';
    if (ctx.measureText(s).width <= maxW) { best = s; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best || '…';
}

export default MixCanvas;
