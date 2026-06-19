import { useEffect, useRef } from 'react';
import type { DiaryEntry } from '../types';
import { EMOTION_PALETTES } from '../types';
import { useDiaryStore } from '../store';

interface TimelineCardProps {
  entry: DiaryEntry;
}

export default function TimelineCard({ entry }: TimelineCardProps) {
  const thumbRef = useRef<HTMLCanvasElement>(null);
  const setSelectedEntryId = useDiaryStore((s) => s.setSelectedEntryId);
  const palette = EMOTION_PALETTES.find((p) => p.type === entry.emotion) ?? EMOTION_PALETTES[0];

  useEffect(() => {
    const canvas = thumbRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = 320;
    const H = canvas.height = 240;

    ctx.fillStyle = 'rgba(255,253,248,0.92)';
    ctx.fillRect(0, 0, W, H);

    const points = entry.inkPoints;
    if (!points || points.length < 2) {
      const [r, g, b] = hexToRgb(palette.color);
      const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.55);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.3)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0.02)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const rw = Math.max(1, maxX - minX);
    const rh = Math.max(1, maxY - minY);
    const scale = Math.min((W * 0.88) / rw, (H * 0.88) / rh);
    const ox = (W - rw * scale) * 0.5 - minX * scale;
    const oy = (H - rh * scale) * 0.5 - minY * scale;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const steps = Math.max(1, Math.floor(Math.hypot(p1.x - p0.x, p1.y - p0.y) / 2));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = (p0.x + (p1.x - p0.x) * t) * scale + ox;
        const y = (p0.y + (p1.y - p0.y) * t) * scale + oy;
        const sz = (p0.size + (p1.size - p0.size) * t) * scale * 0.9;
        const op = p0.opacity + (p1.opacity - p0.opacity) * t;
        const [r, g, b] = hexToRgb(p1.color);

        for (let l = 0; l < 2; l++) {
          const lsz = sz * (1 - l * 0.25);
          const lop = op * (l === 0 ? 0.8 : 0.35);
          const grad = ctx.createRadialGradient(x, y, 0, x, y, lsz * 0.55);
          grad.addColorStop(0, `rgba(${r},${g},${b},${lop})`);
          grad.addColorStop(0.6, `rgba(${r},${g},${b},${lop * 0.4})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, lsz * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [entry, palette.color]);

  const excerpt = entry.content ? entry.content.slice(0, 60).replace(/\s+/g, '') : '（仅有墨迹）';

  return (
    <div
      className="timeline-card"
      onClick={() => setSelectedEntryId(entry.id)}
      role="button"
      tabIndex={0}
    >
      <div className="card-thumbnail">
        <canvas ref={thumbRef} />
      </div>
      <div className="card-info">
        <span className="card-date">{entry.date}</span>
        <span
          className="card-emotion-dot"
          style={{ background: palette.color }}
          title={palette.name}
        />
      </div>
      <div className="card-glass-info">
        <div className="card-excerpt">{excerpt}…</div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
