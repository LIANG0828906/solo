import { useEffect, useRef, useMemo } from 'react';
import type { EarthquakeEvent, StatsData } from '@/types';
import { Activity, AlertTriangle } from 'lucide-react';

interface StatsPanelProps {
  earthquakes: EarthquakeEvent[];
}

const COLORS = {
  '4-5': '#4ADE80',
  '5-6': '#FACC15',
  '6-7': '#FB923C',
  '7+': '#EF4444',
};

export default function StatsPanel({ earthquakes }: StatsPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stats: StatsData = useMemo(() => {
    let max = 0;
    const distribution: StatsData['distribution'] = { '4-5': 0, '5-6': 0, '6-7': 0, '7+': 0 };
    for (const eq of earthquakes) {
      if (eq.magnitude > max) max = eq.magnitude;
      if (eq.magnitude >= 7) distribution['7+']++;
      else if (eq.magnitude >= 6) distribution['6-7']++;
      else if (eq.magnitude >= 5) distribution['5-6']++;
      else if (eq.magnitude >= 4) distribution['4-5']++;
    }
    return { total: earthquakes.length, maxMagnitude: max, distribution };
  }, [earthquakes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 110;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = 44;
    const ir = 24;

    ctx.clearRect(0, 0, size, size);

    const total = Object.values(stats.distribution).reduce((a, b) => a + b, 0);
    if (total === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx, cy, ir, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      return;
    }

    let start = -Math.PI / 2;
    const entries = Object.entries(stats.distribution) as Array<[keyof typeof COLORS, number]>;
    for (const [key, val] of entries) {
      if (val === 0) continue;
      const frac = val / total;
      const end = start + frac * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, end);
      ctx.arc(cx, cy, ir, end, start, true);
      ctx.closePath();
      ctx.fillStyle = COLORS[key];
      ctx.fill();
      ctx.strokeStyle = 'rgba(10,10,35,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      start = end;
    }
  }, [stats.distribution]);

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 76,
        background: 'rgba(22,33,62,0.85)',
        borderRadius: 12,
        padding: 12,
        color: '#E0E0E0',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        boxShadow: '0 0 15px rgba(233,69,96,0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(233,69,96,0.2)',
        minWidth: 200,
        zIndex: 45,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Activity size={14} color="#E94560" />
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>实时统计</span>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(224,224,224,0.6)', marginBottom: 2 }}>事件总数</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{stats.total}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} color="#FF3366" />
            <span style={{ fontSize: 11, color: 'rgba(224,224,224,0.6)' }}>最大震级</span>
          </div>
          <div style={{ color: '#FF3366', fontWeight: 800, fontSize: 24, lineHeight: 1.1 }}>
            {stats.maxMagnitude ? stats.maxMagnitude.toFixed(1) : '--'}
          </div>
        </div>

        <canvas ref={canvasRef} />
      </div>

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {Object.entries(COLORS).map(([k, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />
            <span style={{ color: 'rgba(224,224,224,0.7)' }}>{k} M</span>
            <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
              {stats.distribution[k as keyof typeof stats.distribution]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
