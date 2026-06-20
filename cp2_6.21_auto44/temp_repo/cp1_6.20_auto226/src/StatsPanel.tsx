import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Voice, Measure } from './types';

interface StatsPanelProps {
  voices: Voice[];
  measures: Measure[];
  bpm: number;
}

interface VoiceStats {
  voiceId: string;
  name: string;
  color: string;
  totalDuration: number;
  avgPitch: number;
  noteCount: number;
}

interface Segment {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
  value: string;
}

function computeStats(voices: Voice[], measures: Measure[], bpm: number): VoiceStats[] {
  return voices.map((v) => {
    const notes = measures.flatMap((m) => m.notes.filter((n) => n.voiceId === v.id));
    const totalDuration = notes.reduce((s, n) => s + n.duration * 60 / bpm, 0);
    const avgPitch = notes.length > 0 ? notes.reduce((s, n) => s + n.pitch, 0) / notes.length : 0;
    return { voiceId: v.id, name: v.name, color: v.color, totalDuration, avgPitch, noteCount: notes.length };
  });
}

const MARGIN = { left: 60, bottom: 40, top: 30, right: 20 };
const BAR_W = 60;
const TICKS = 5;

export default function StatsPanel(props: StatsPanelProps) {
  const { voices, measures, bpm } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(400);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: string } | null>(null);
  const segmentsRef = useRef<Segment[]>([]);

  const stats = computeStats(voices, measures, bpm);

  const durationMax = stats.reduce((m, s) => Math.max(m, s.totalDuration), 0) || 1;
  const pitchMax = stats.reduce((m, s) => Math.max(m, s.avgPitch), 0) || 1;

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const h = 300;
    canvas.width = canvasW * dpr;
    canvas.height = h * dpr;
    canvas.style.width = canvasW + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasW, h);

    const chartW = canvasW - MARGIN.left - MARGIN.right;
    const chartH = h - MARGIN.top - MARGIN.bottom;

    ctx.strokeStyle = '#555';
    ctx.fillStyle = '#9e9e9e';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const barGap = chartW / 2;
    const barCenterX = [MARGIN.left + barGap / 2, MARGIN.left + barGap / 2 + barGap];
    const maxValues = [durationMax, pitchMax];

    for (let cat = 0; cat < 2; cat++) {
      const maxVal = maxValues[cat];
      for (let i = 0; i <= TICKS; i++) {
        const val = (maxVal / TICKS) * i;
        const y = MARGIN.top + chartH - (chartH * i / TICKS);
        if (cat === 0) {
          ctx.beginPath();
          ctx.moveTo(MARGIN.left, y);
          ctx.lineTo(canvasW - MARGIN.right, y);
          ctx.stroke();
          ctx.fillText(val.toFixed(1), MARGIN.left - 8, y);
        }
      }
    }

    ctx.beginPath();
    ctx.moveTo(MARGIN.left, MARGIN.top);
    ctx.lineTo(MARGIN.left, MARGIN.top + chartH);
    ctx.lineTo(canvasW - MARGIN.right, MARGIN.top + chartH);
    ctx.stroke();

    const newSegments: Segment[] = [];

    for (let cat = 0; cat < 2; cat++) {
      const cx = barCenterX[cat];
      const bx = cx - BAR_W / 2;
      const maxVal = maxValues[cat];
      let cumY = 0;

      for (const s of stats) {
        const val = cat === 0 ? s.totalDuration : s.avgPitch;
        const segH = (val / maxVal) * chartH;
        const sy = MARGIN.top + chartH - cumY - segH;

        ctx.fillStyle = s.color;
        ctx.fillRect(bx, sy, BAR_W, segH);

        if (segH > 20) {
          ctx.fillStyle = '#fff';
          ctx.font = '10px "Noto Sans SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.name, cx, sy + segH / 2);
        }

        newSegments.push({
          x: bx, y: sy, w: BAR_W, h: segH, color: s.color,
          label: s.name,
          value: cat === 0 ? `总时长: ${s.totalDuration.toFixed(1)}s` : `平均音高: MIDI ${Math.round(s.avgPitch)}`,
        });

        cumY += segH;
      }

      ctx.fillStyle = '#9e9e9e';
      ctx.font = '12px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(cat === 0 ? '总时长(s)' : '平均音高', cx, MARGIN.top + chartH + 10);
    }

    segmentsRef.current = newSegments;
  }, [canvasW, stats, durationMax, pitchMax]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasW(Math.max(entry.contentRect.width, 200));
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const seg of segmentsRef.current) {
      if (mx >= seg.x && mx <= seg.x + seg.w && my >= seg.y && my <= seg.y + seg.h) {
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: seg.label, value: seg.value });
        return;
      }
    }
    setTooltip(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div style={{ background: '#252525', padding: 12, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', marginBottom: 8 }}>声部统计</div>

      <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 200 }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'block' }}
        />
        {tooltip && (
          <div
            className="glass-bubble"
            style={{
              position: 'absolute',
              left: tooltip.x + 12,
              top: tooltip.y - 8,
              padding: '8px 12px',
              fontSize: 12,
              color: '#e0e0e0',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 600 }}>{tooltip.label}</div>
            <div>{tooltip.value}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {stats.map((s) => (
          <div key={s.voiceId} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#9e9e9e' }}>{s.name}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        {stats.map((s) => (
          <div key={s.voiceId} style={{ background: '#2d2d2d', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>{s.name}</span>
            </div>
            <div style={{ fontSize: 12, color: '#9e9e9e', lineHeight: 1.6, paddingLeft: 16 }}>
              <div>总时长: {s.totalDuration.toFixed(1)}s</div>
              <div>平均音高: MIDI {Math.round(s.avgPitch)}</div>
              <div>音符数: {s.noteCount}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
