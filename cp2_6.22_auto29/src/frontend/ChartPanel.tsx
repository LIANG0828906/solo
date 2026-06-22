import React, { useRef, useEffect, useCallback } from 'react';
import type { AdVersion, MetricsHistoryPoint } from '../types';

interface Props {
  metricsHistory: Record<string, MetricsHistoryPoint[]>;
  versionIds: string[];
  versions: AdVersion[];
}

const COLORS = ['#00e5ff', '#00f0c0', '#7c4dff', '#ff9100', '#ff5252'];

function drawLineChart(
  canvas: HTMLCanvasElement,
  data: { points: MetricsHistoryPoint[]; color: string; label: string }[],
  title: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  const pad = { top: 36, right: 20, bottom: 36, left: 56 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.fillStyle = '#0c1629';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#8ba3c7';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText(title, pad.left, 18);

  let maxVal = 0;
  data.forEach((d) => {
    d.points.forEach((p) => {
      const v = p.ctr * 100;
      if (v > maxVal) maxVal = v;
    });
  });
  maxVal = Math.max(maxVal * 1.2, 1);

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();

    ctx.fillStyle = '#4a6285';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(((maxVal * (4 - i)) / 4).toFixed(1) + '%', pad.left - 8, y + 4);
  }
  ctx.textAlign = 'left';

  data.forEach((d) => {
    if (d.points.length < 2) return;
    const points = d.points;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    points.forEach((p, i) => {
      const x = pad.left + (i / Math.max(points.length - 1, 1)) * plotW;
      const y = pad.top + plotH - (p.ctr * 100 / maxVal) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const lastP = points[points.length - 1];
    const lastX = pad.left + plotW;
    const lastY = pad.top + plotH - (lastP.ctr * 100 / maxVal) * plotH;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  const legendY = h - 12;
  let legendX = pad.left;
  data.forEach((d, i) => {
    ctx.fillStyle = d.color;
    ctx.fillRect(legendX, legendY - 8, 10, 10);
    ctx.fillStyle = '#8ba3c7';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(d.label, legendX + 14, legendY);
    legendX += ctx.measureText(d.label).width + 28;
  });
}

function drawBarChart(
  canvas: HTMLCanvasElement,
  data: { value: number; color: string; label: string }[],
  title: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  const pad = { top: 36, right: 20, bottom: 48, left: 56 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.fillStyle = '#0c1629';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#8ba3c7';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText(title, pad.left, 18);

  let maxVal = 0;
  data.forEach((d) => {
    if (d.value > maxVal) maxVal = d.value;
  });
  maxVal = Math.max(maxVal * 1.2, 1);

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();

    ctx.fillStyle = '#4a6285';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(((maxVal * (4 - i)) / 4).toFixed(2) + '%', pad.left - 8, y + 4);
  }
  ctx.textAlign = 'left';

  if (data.length === 0) return;
  const barWidth = Math.min(48, plotW / data.length - 16);
  const gap = (plotW - barWidth * data.length) / (data.length + 1);

  data.forEach((d, i) => {
    const x = pad.left + gap + (barWidth + gap) * i;
    const barH = (d.value / maxVal) * plotH;
    const y = pad.top + plotH - barH;

    const grad = ctx.createLinearGradient(x, y, x, pad.top + plotH);
    grad.addColorStop(0, d.color);
    grad.addColorStop(1, d.color + '33');
    ctx.fillStyle = grad;
    ctx.beginPath();
    const r = 4;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, pad.top + plotH);
    ctx.lineTo(x, pad.top + plotH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();

    ctx.fillStyle = '#8ba3c7';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barWidth / 2, pad.top + plotH + 16);
    ctx.fillStyle = d.color;
    ctx.font = '600 10px Inter, sans-serif';
    ctx.fillText(d.value.toFixed(2) + '%', x + barWidth / 2, y - 6);
  });
  ctx.textAlign = 'left';
}

export default function ChartPanel({ metricsHistory, versionIds, versions }: Props) {
  const lineRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);

  const redraw = useCallback(() => {
    if (!lineRef.current || !barRef.current) return;

    const lineData = versionIds.map((vid, i) => ({
      points: metricsHistory[vid] || [],
      color: COLORS[i % COLORS.length],
      label: versions.find((v) => v.id === vid)?.title || `版本 ${String.fromCharCode(65 + i)}`,
    }));

    drawLineChart(lineRef.current, lineData, 'CTR 趋势');

    const lastMetrics: Record<string, MetricsHistoryPoint | null> = {};
    versionIds.forEach((vid) => {
      const hist = metricsHistory[vid];
      lastMetrics[vid] = hist && hist.length > 0 ? hist[hist.length - 1] : null;
    });

    const barData = versionIds.map((vid, i) => ({
      value: (lastMetrics[vid]?.cvr ?? 0) * 100,
      color: COLORS[i % COLORS.length],
      label: versions.find((v) => v.id === vid)?.title?.substring(0, 8) || `V${i + 1}`,
    }));

    drawBarChart(barRef.current, barData, 'CVR 对比');
  }, [metricsHistory, versionIds, versions]);

  useEffect(() => {
    redraw();
    const handleResize = () => redraw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw]);

  return (
    <div style={styles.container}>
      <div style={styles.chartRow}>
        <div style={styles.chartWrap}>
          <canvas
            ref={lineRef}
            style={styles.canvas}
          />
        </div>
        <div style={styles.chartWrap}>
          <canvas
            ref={barRef}
            style={styles.canvas}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 24,
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 16,
  },
  chartWrap: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    backdropFilter: 'blur(12px)',
  },
  canvas: {
    width: '100%',
    height: 260,
    display: 'block',
    borderRadius: 'var(--radius-sm)',
  },
};
