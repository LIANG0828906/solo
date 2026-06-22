import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { AdVersion, MetricsHistoryPoint } from '../types';

interface Props {
  metricsHistory: Record<string, MetricsHistoryPoint[]>;
  versionIds: string[];
  versions: AdVersion[];
}

const COLORS = ['#00e5ff', '#00f0c0', '#7c4dff', '#ff9100', '#ff5252'];

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function drawLineChart(
  canvas: HTMLCanvasElement,
  data: { points: MetricsHistoryPoint[]; color: string; label: string }[],
  title: string,
  yLabel: string
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
  const pad = { top: 50, right: 24, bottom: 56, left: 68 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#0c1629');
  bgGrad.addColorStop(1, '#070d1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#e8f0fe';
  ctx.font = '600 14px Inter, sans-serif';
  ctx.fillText(title, pad.left, 24);

  ctx.fillStyle = '#4a6285';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText(yLabel, 8, pad.top - 10);

  let maxVal = 0;
  let minVal = Infinity;
  let maxPoints = 0;
  data.forEach((d) => {
    if (d.points.length > maxPoints) maxPoints = d.points.length;
    d.points.forEach((p) => {
      const v = p.ctr * 100;
      if (v > maxVal) maxVal = v;
      if (v < minVal) minVal = v;
    });
  });
  if (maxVal === 0) maxVal = 1;
  if (minVal === Infinity || minVal === maxVal) minVal = 0;
  const range = maxVal - minVal;
  maxVal = maxVal + range * 0.15;
  minVal = Math.max(0, minVal - range * 0.05);

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + (plotH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();

    const val = maxVal - ((maxVal - minVal) / gridLines) * i;
    ctx.fillStyle = '#4a6285';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(2) + '%', pad.left - 8, y + 3);
  }
  ctx.textAlign = 'left';

  const firstPoints = data[0]?.points || [];
  if (firstPoints.length > 0) {
    const xStep = maxPoints > 1 ? plotW / (maxPoints - 1) : 0;
    const labelCount = Math.min(6, firstPoints.length);
    const step = Math.max(1, Math.floor(firstPoints.length / labelCount));
    for (let i = 0; i < firstPoints.length; i += step) {
      const x = pad.left + (i * xStep);
      ctx.fillStyle = '#4a6285';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(formatTime(firstPoints[i].timestamp), x, pad.top + plotH + 18);
    }
    ctx.textAlign = 'left';
  }

  data.forEach((d) => {
    if (d.points.length < 2) return;
    const points = d.points;
    const xStep = points.length > 1 ? plotW / (points.length - 1) : 0;

    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    areaGrad.addColorStop(0, d.color + '25');
    areaGrad.addColorStop(1, d.color + '00');
    ctx.fillStyle = areaGrad;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = pad.left + i * xStep;
      const y = pad.top + plotH - ((p.ctr * 100 - minVal) / (maxVal - minVal)) * plotH;
      if (i === 0) ctx.moveTo(x, pad.top + plotH);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + (points.length - 1) * xStep, pad.top + plotH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 8;
    points.forEach((p, i) => {
      const x = pad.left + i * xStep;
      const y = pad.top + plotH - ((p.ctr * 100 - minVal) / (maxVal - minVal)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    const lastP = points[points.length - 1];
    const lastX = pad.left + (points.length - 1) * xStep;
    const lastY = pad.top + plotH - ((lastP.ctr * 100 - minVal) / (maxVal - minVal)) * plotH;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  const legendY = h - 22;
  let legendX = pad.left;
  data.forEach((d) => {
    ctx.fillStyle = d.color;
    ctx.fillRect(legendX, legendY - 6, 12, 12);
    ctx.fillStyle = '#8ba3c7';
    ctx.font = '11px Inter, sans-serif';
    const labelText = d.label.substring(0, 14);
    ctx.fillText(labelText, legendX + 18, legendY + 3);
    legendX += 18 + ctx.measureText(labelText).width + 20;
  });
}

function drawBarChart(
  canvas: HTMLCanvasElement,
  data: { value: number; color: string; label: string; sublabel?: string }[],
  title: string,
  yLabel: string
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
  const pad = { top: 50, right: 24, bottom: 56, left: 68 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#0c1629');
  bgGrad.addColorStop(1, '#070d1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#e8f0fe';
  ctx.font = '600 14px Inter, sans-serif';
  ctx.fillText(title, pad.left, 24);

  ctx.fillStyle = '#4a6285';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText(yLabel, 8, pad.top - 10);

  let maxVal = 0;
  data.forEach((d) => {
    if (d.value > maxVal) maxVal = d.value;
  });
  if (maxVal === 0) maxVal = 1;
  maxVal = maxVal * 1.2;

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + (plotH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();

    const val = (maxVal * (gridLines - i)) / gridLines;
    ctx.fillStyle = '#4a6285';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(2) + '%', pad.left - 8, y + 3);
  }
  ctx.textAlign = 'left';

  if (data.length === 0) return;
  const barWidth = Math.min(60, plotW / data.length - 24);
  const gap = (plotW - barWidth * data.length) / (data.length + 1);

  data.forEach((d, i) => {
    const x = pad.left + gap + (barWidth + gap) * i;
    const barH = (d.value / maxVal) * plotH;
    const y = pad.top + plotH - barH;

    const grad = ctx.createLinearGradient(x, y, x, pad.top + plotH);
    grad.addColorStop(0, d.color);
    grad.addColorStop(1, d.color + '33');
    ctx.fillStyle = grad;
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 12;

    const r = 6;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, pad.top + plotH);
    ctx.lineTo(x, pad.top + plotH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = d.color;
    ctx.font = '700 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.value.toFixed(2) + '%', x + barWidth / 2, y - 8);

    ctx.fillStyle = '#8ba3c7';
    ctx.font = '11px Inter, sans-serif';
    const label = d.label.substring(0, 10);
    ctx.fillText(label, x + barWidth / 2, pad.top + plotH + 18);
    if (d.sublabel) {
      ctx.fillStyle = '#4a6285';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(d.sublabel, x + barWidth / 2, pad.top + plotH + 32);
    }
  });
  ctx.textAlign = 'left';

  const legendY = h - 4;
  let legendX = pad.left;
  data.forEach((d) => {
    ctx.fillStyle = d.color;
    ctx.fillRect(legendX, legendY - 10, 10, 10);
    legendX += 18 + 60;
  });
}

export default function ChartPanel({ metricsHistory, versionIds, versions }: Props) {
  const lineRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const [chartKey, setChartKey] = useState(0);

  const redraw = useCallback(() => {
    if (!lineRef.current || !barRef.current) return;

    const lineData = versionIds.map((vid, i) => ({
      points: metricsHistory[vid] || [],
      color: COLORS[i % COLORS.length],
      label: versions.find((v) => v.id === vid)?.title || `版本 ${String.fromCharCode(65 + i)}`,
    }));

    drawLineChart(lineRef.current, lineData, 'CTR 趋势图', '点击率 (%)');

    const lastMetrics: Record<string, number> = {};
    versionIds.forEach((vid) => {
      const hist = metricsHistory[vid];
      if (hist && hist.length > 0) {
        lastMetrics[vid] = hist[hist.length - 1].cvr * 100;
      } else {
        lastMetrics[vid] = 0;
      }
    });

    const barData = versionIds.map((vid, i) => ({
      value: lastMetrics[vid] ?? 0,
      color: COLORS[i % COLORS.length],
      label: (versions.find((v) => v.id === vid)?.title || `版本${i + 1}`).substring(0, 8),
      sublabel: `版本 ${String.fromCharCode(65 + i)}`,
    }));

    drawBarChart(barRef.current, barData, 'CVR 对比图', '转化率 (%)');
  }, [metricsHistory, versionIds, versions]);

  useEffect(() => {
    let animId: number;
    let start = performance.now();
    const duration = 600;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      redraw();
      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };
    animId = requestAnimationFrame(animate);
    setChartKey((k) => k + 1);
    return () => cancelAnimationFrame(animId);
  }, [metricsHistory]);

  useEffect(() => {
    redraw();
    const handleResize = () => redraw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw]);

  return (
    <div key={chartKey} style={styles.container}>
      <div style={styles.chartRow}>
        <div style={styles.chartCard}>
          <canvas
            ref={lineRef}
            style={styles.canvas}
          />
        </div>
        <div style={styles.chartCard}>
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
    animation: 'fadeIn 0.4s ease',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: 18,
  },
  chartCard: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 0,
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: 280,
    display: 'block',
  },
};
