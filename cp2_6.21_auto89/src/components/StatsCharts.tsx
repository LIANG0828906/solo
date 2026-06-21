import React, { useRef, useEffect } from 'react';
import { StatsData } from '../services/api';

interface StatsChartsProps {
  stats: StatsData;
}

const COLORS = ['#3498DB', '#1ABC9C', '#F39C12', '#E74C3C', '#9B59B6', '#27AE60', '#34495E', '#E67E86'];

const StatsCharts: React.FC<StatsChartsProps> = ({ stats }) => {
  const histogramRef = useRef<HTMLCanvasElement>(null);
  const pieRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawHistogram();
  }, [stats.age_distribution]);

  useEffect(() => {
    drawPieChart();
  }, [stats.event_type_counts]);

  useEffect(() => {
    drawLineChart();
  }, [stats.generation_gaps, stats.avg_generation_gap]);

  const drawHistogram = () => {
    const canvas = histogramRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, w, h);

    const buckets = Object.entries(stats.age_distribution)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    if (buckets.length === 0) return;

    const maxVal = Math.max(...buckets.map(([, v]) => v), 1);
    const barW = (chartW / buckets.length) * 0.7;
    const gap = (chartW / buckets.length) * 0.3;

    buckets.forEach(([label, value], idx) => {
      const x = padding.left + idx * (barW + gap) + gap / 2;
      const barH = (value / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
      gradient.addColorStop(0, '#3498DB');
      gradient.addColorStop(1, '#2980B9');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 4);
      ctx.fill();

      ctx.fillStyle = '#ECF0F1';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(value), x + barW / 2, y - 6);

      ctx.fillStyle = '#95A5A6';
      ctx.font = '10px sans-serif';
      ctx.fillText(label, x + barW / 2, padding.top + chartH + 18);
    });

    ctx.strokeStyle = '#4A6478';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();

    ctx.fillStyle = '#BDC3C7';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('成员年龄分布', padding.left, 18);
    ctx.textAlign = 'center';
    ctx.fillText('年龄区间', padding.left + chartW / 2, h - 8);
    ctx.save();
    ctx.translate(14, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('人数', 0, 0);
    ctx.restore();
  };

  const drawPieChart = () => {
    const canvas = pieRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w * 0.4;
    const cy = h / 2 + 10;
    const radius = Math.min(w * 0.35, (h - 60) / 2);

    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, w, h);

    const entries = Object.entries(stats.event_type_counts);
    if (entries.length === 0) {
      ctx.fillStyle = '#95A5A6';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', w / 2, h / 2);
      return;
    }

    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    let startAngle = -Math.PI / 2;

    entries.forEach(([label, value], idx) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const color = COLORS[idx % COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (sliceAngle > 0.2) {
        const midAngle = startAngle + sliceAngle / 2;
        const labelR = radius * 0.6;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        const pct = ((value / total) * 100).toFixed(0) + '%';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pct, lx, ly);
      }

      startAngle = endAngle;
    });

    const legendX = w * 0.72;
    const legendY = 40;
    entries.forEach(([label, value], idx) => {
      const ly = legendY + idx * 22;
      ctx.fillStyle = COLORS[idx % COLORS.length];
      ctx.beginPath();
      ctx.roundRect(legendX, ly, 14, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#ECF0F1';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${label} (${value})`, legendX + 20, ly);
    });

    ctx.fillStyle = '#BDC3C7';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('事件类型分布', 12, 18);
  };

  const drawLineChart = () => {
    const canvas = lineRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, w, h);

    const gaps = stats.generation_gaps;
    if (gaps.length === 0) {
      ctx.fillStyle = '#95A5A6';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无足够数据计算世代间隔', w / 2, h / 2);
      return;
    }

    const maxGap = Math.max(...gaps, 50);
    const minGap = Math.min(...gaps, 15);
    const range = maxGap - minGap || 1;
    const avg = stats.avg_generation_gap;

    ctx.strokeStyle = '#4A6478';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
      const val = maxGap - (range / 4) * i;
      ctx.fillStyle = '#95A5A6';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0), padding.left - 6, y + 3);
    }

    const avgY = padding.top + chartH - ((avg - minGap) / range) * chartH;
    ctx.strokeStyle = '#F1C40F';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, avgY);
    ctx.lineTo(padding.left + chartW, avgY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#F1C40F';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`平均: ${avg}岁`, padding.left + chartW - 80, avgY - 6);

    ctx.strokeStyle = '#1ABC9C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    gaps.forEach((gap, idx) => {
      const x = padding.left + (chartW / (gaps.length - 1 || 1)) * idx;
      const y = padding.top + chartH - ((gap - minGap) / range) * chartH;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    gaps.forEach((gap, idx) => {
      const x = padding.left + (chartW / (gaps.length - 1 || 1)) * idx;
      const y = padding.top + chartH - ((gap - minGap) / range) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#1ABC9C';
      ctx.fill();
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (gaps.length <= 10) {
        ctx.fillStyle = '#ECF0F1';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(gap.toFixed(0), x, padding.top + chartH + 16);
      }
    });

    ctx.strokeStyle = '#4A6478';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();

    ctx.fillStyle = '#BDC3C7';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('世代间隔分布', padding.left, 18);
    ctx.textAlign = 'center';
    ctx.fillText('世代序号', padding.left + chartW / 2, h - 8);
    ctx.save();
    ctx.translate(14, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('间隔(岁)', 0, 0);
    ctx.restore();
  };

  return (
    <div className="chart-container">
      <div className="chart-row">
        <div className="chart-wrapper">
          <canvas
            ref={histogramRef}
            style={{ width: '100%', height: 220, display: 'block' }}
          />
        </div>
        <div className="chart-wrapper">
          <canvas
            ref={pieRef}
            style={{ width: '100%', height: 220, display: 'block' }}
          />
        </div>
      </div>
      <div className="chart-wrapper">
        <canvas
          ref={lineRef}
          style={{ width: '100%', height: 220, display: 'block' }}
        />
      </div>
    </div>
  );
};

export default StatsCharts;
