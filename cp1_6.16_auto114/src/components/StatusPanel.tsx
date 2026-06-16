import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  User, Calendar, Droplets, Sprout, RefreshCw,
  CheckCircle, BookOpen, MapPin, Clock
} from 'lucide-react';
import { useGardenStore } from '../store/gardenStore';
import type { GardenStats, GrowthPoint, Plot } from '../types';
import {
  formatDate,
  generateGrowthData,
  daysBetween,
  randomCropName
} from '../utils';
import './StatusPanel.css';

const DONUT_COLORS = {
  idle: '#D2B48C',
  planted: '#8FBC8F',
  harvestable: '#F0E68C'
};

const DonutChart: React.FC<{ stats: GardenStats; size?: number }> = ({ stats, size = 250 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = Math.min(cx, cy) - 10;
    const innerR = radius * 0.58;

    const total = stats.idle + stats.planted + stats.harvestable || 1;
    const segments = [
      { key: 'idle', value: stats.idle, color: DONUT_COLORS.idle, label: '空闲' },
      { key: 'planted', value: stats.planted, color: DONUT_COLORS.planted, label: '种植中' },
      { key: 'harvestable', value: stats.harvestable, color: DONUT_COLORS.harvestable, label: '待收获' }
    ];

    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
      const fraction = seg.value / total;
      const endAngle = startAngle + fraction * Math.PI * 2;
      if (fraction > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();
        const grd = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
        grd.addColorStop(0, seg.color);
        grd.addColorStop(1, shade(seg.color, -10));
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(250, 240, 230, 0.7)';
        ctx.stroke();
      }
      startAngle = endAngle;
    });

    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 18px "Segoe UI", PingFang SC, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${total}`, cx, cy - 8);
    ctx.font = '12px "Segoe UI", PingFang SC, sans-serif';
    ctx.fillStyle = '#6D4C41';
    ctx.fillText('地块总数', cx, cy + 12);
  }, [stats, size]);

  return (
    <div className="donut-wrap">
      <canvas ref={canvasRef} />
      <div className="donut-legend">
        <div><i style={{ background: DONUT_COLORS.idle }} />空闲 {stats.idle}</div>
        <div><i style={{ background: DONUT_COLORS.planted }} />种植 {stats.planted}</div>
        <div><i style={{ background: DONUT_COLORS.harvestable }} />待收 {stats.harvestable}</div>
      </div>
    </div>
  );
};

interface LineChartProps {
  data: GrowthPoint[];
  width?: number;
  height?: number;
}

const GrowthLineChart: React.FC<LineChartProps> = ({ data, width = 280, height = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const padding = { top: 18, right: 14, bottom: 26, left: 30 };
      const w = width - padding.left - padding.right;
      const h = height - padding.top - padding.bottom;

      const values = data.map(d => d.height);
      const maxY = Math.max(...values, 1) * 1.15;
      const minY = 0;

      ctx.strokeStyle = 'rgba(62, 39, 35, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + w, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#6D4C41';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 4; i++) {
        const v = maxY - (maxY - minY) * (i / 4);
        const y = padding.top + (h / 4) * i;
        ctx.fillText(v.toFixed(0), padding.left - 4, y);
      }

      const stepX = data.length > 1 ? w / (data.length - 1) : 0;
      const points = data.map((d, i) => {
        const x = padding.left + stepX * i;
        const y = padding.top + h - ((d.height - minY) / (maxY - minY)) * h;
        return { x, y, label: d.dayLabel, value: d.height };
      });

      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
          const prev = points[i - 1];
          const cx = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        }
      });
      ctx.lineTo(points[points.length - 1].x, padding.top + h);
      ctx.lineTo(points[0].x, padding.top + h);
      ctx.closePath();
      const areaGrd = ctx.createLinearGradient(0, padding.top, 0, padding.top + h);
      areaGrd.addColorStop(0, 'rgba(76, 175, 80, 0.35)');
      areaGrd.addColorStop(1, 'rgba(76, 175, 80, 0.02)');
      ctx.fillStyle = areaGrd;
      ctx.fill();

      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
          const prev = points[i - 1];
          const cx = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        }
      });
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#6D4C41';
      ctx.font = '10px "Segoe UI", sans-serif';
      points.forEach((p, i) => {
        if (i % Math.ceil(points.length / 7) === 0 || i === points.length - 1) {
          ctx.fillText(p.label, p.x, padding.top + h + 6);
        }
      });

      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FAF0E6';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#4CAF50';
        ctx.stroke();
        if (hoverIdx === i) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
          ctx.fill();
          const tw = 56;
          const tx = Math.max(0, Math.min(width - tw, p.x - tw / 2));
          const ty = Math.max(0, p.y - 28);
          ctx.fillStyle = 'rgba(62, 39, 35, 0.9)';
          roundRect(ctx, tx, ty, tw, 22, 6);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${p.value} cm`, p.x, ty + 11);
        }
      });
    };

    const render = () => {
      rafRef.current = requestAnimationFrame(draw);
    };
    render();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data, width, height, hoverIdx]);

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const padding = { left: 30, right: 14 };
    const w = width - padding.left - padding.right;
    const stepX = data.length > 1 ? w / (data.length - 1) : 0;
    let nearest = -1;
    let best = Infinity;
    data.forEach((_, i) => {
      const px = padding.left + stepX * i;
      const d = Math.abs(px - mx);
      if (d < best && d < 18) {
        best = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest >= 0 ? nearest : null);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
      className="growth-canvas"
    />
  );
};

export const StatusPanel: React.FC = () => {
  const selectedPlotId = useGardenStore(s => s.selectedPlotId);
  const getPlot = useGardenStore(s => s.getPlot);
  const getStats = useGardenStore(s => s.getStats);
  const addJournal = useGardenStore(s => s.addJournal);
  const markHarvestable = useGardenStore(s => s.markHarvestable);
  const toggleExchangeable = useGardenStore(s => s.toggleExchangeable);

  const plot: Plot | undefined = selectedPlotId ? getPlot(selectedPlotId) : undefined;
  const stats = useMemo(() => getStats(), [getStats, selectedPlotId, useGardenStore.getState().plots.length]);

  const [form, setForm] = useState({ cropName: '', plantDate: formatDate(new Date()), waterNote: '' });

  useEffect(() => {
    if (plot && !form.cropName) {
      setForm({
        cropName: plot.cropName || randomCropName(),
        plantDate: plot.plantDate || formatDate(new Date()),
        waterNote: ''
      });
    }
  }, [selectedPlotId]);

  const growthData = useMemo(() => {
    if (!plot || plot.status === 'idle') return generateGrowthData(7, 0, 0);
    const base = plot.status === 'harvestable' ? 22 : plot.plantDate ? daysBetween(plot.plantDate) * 1.6 + 4 : 6;
    return generateGrowthData(7, base, 5);
  }, [selectedPlotId, plot?.status, plot?.plantDate]);

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plot) return;
    if (!form.cropName.trim()) return;
    addJournal(plot.id, {
      cropName: form.cropName.trim(),
      plantDate: form.plantDate,
      waterNote: form.waterNote.trim()
    });
    setForm(f => ({ ...f, waterNote: '' }));
    if (!plot.cropName) {
      const state = useGardenStore.getState();
      state.plots = state.plots.map(p => p.id === plot.id ? { ...p, cropName: form.cropName.trim() } : p);
    }
  };

  return (
    <aside className="status-panel">
      <div className="status-panel__header">
        <h3>🌿 菜园状态面板</h3>
      </div>

      <div className="status-panel__section">
        <h4 className="section-title"><span>📊</span>状态分布</h4>
        <DonutChart stats={stats} size={220} />
      </div>

      <div className="status-panel__section">
        <h4 className="section-title"><span>📍</span>当前地块</h4>
        {!plot ? (
          <div className="empty-hint">
            <MapPin size={28} opacity={0.5} />
            <p>请在左侧网格中选择一个地块查看详情</p>
          </div>
        ) : (
          <div className="plot-detail">
            <div className="detail-row">
              <MapPin size={14} />
              <span className="label">坐标</span>
              <b>第 {plot.row + 1} 行 · 第 {plot.col + 1} 列</b>
            </div>
            <div className="detail-row">
              <User size={14} />
              <span className="label">认领人</span>
              <b>
                {plot.status === 'idle' ? '—' : (
                  <><span className="avatar-sm">{plot.ownerAvatar}</span>{plot.ownerName}</>
                )}
              </b>
            </div>
            <div className="detail-row">
              <Sprout size={14} />
              <span className="label">种植作物</span>
              <b>{plot.cropName || (plot.status === 'idle' ? '—' : '未设置')}</b>
            </div>
            <div className="detail-row">
              <Calendar size={14} />
              <span className="label">种植日期</span>
              <b>{plot.plantDate || '—'}</b>
            </div>
            <div className="detail-row">
              <Clock size={14} />
              <span className="label">距收获</span>
              <b>
                {plot.status === 'harvestable' ? <span className="tag-harvest">✓ 已成熟</span> :
                 plot.daysToHarvest !== undefined ? `${plot.daysToHarvest} 天` : '—'}
              </b>
            </div>
            <div className="detail-row">
              <Droplets size={14} />
              <span className="label">浇水次数</span>
              <b>{plot.waterRecords.length} 次</b>
            </div>

            {plot.status !== 'idle' && (
              <div className="action-buttons">
                {plot.status === 'planted' && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => markHarvestable(plot.id)}
                  >
                    <CheckCircle size={14} /> 标记待收获
                  </button>
                )}
                {plot.status === 'harvestable' && (
                  <button
                    type="button"
                    className={`btn ${plot.exchangeable ? 'btn--warning' : 'btn--accent'}`}
                    onClick={() => toggleExchangeable(plot.id)}
                  >
                    <RefreshCw size={14} />
                    {plot.exchangeable ? '取消可交换' : '标记可交换'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {plot && plot.status !== 'idle' && (
        <div className="status-panel__section">
          <h4 className="section-title"><span>📈</span>生长趋势（近 7 天）</h4>
          <GrowthLineChart data={growthData} width={280} height={160} />
          <p className="chart-caption">单位：厘米（cm），估算的平均作物高度</p>
        </div>
      )}

      {plot && plot.status !== 'idle' && (
        <div className="status-panel__section">
          <h4 className="section-title"><span>📖</span>添加种植日志</h4>
          <form className="journal-form" onSubmit={handleAddJournal}>
            <div className="field">
              <label>作物名称</label>
              <input
                type="text"
                value={form.cropName}
                onChange={e => setForm(f => ({ ...f, cropName: e.target.value }))}
                placeholder="如：番茄"
                required
              />
            </div>
            <div className="field">
              <label>种植日期</label>
              <input
                type="date"
                value={form.plantDate}
                onChange={e => setForm(f => ({ ...f, plantDate: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>浇水备注</label>
              <textarea
                rows={2}
                value={form.waterNote}
                onChange={e => setForm(f => ({ ...f, waterNote: e.target.value }))}
                placeholder="描述浇水、施肥或观察到的生长情况…"
              />
            </div>
            <button type="submit" className="btn btn--primary btn--block">
              <Droplets size={14} /> 记录并浇水
            </button>
          </form>
        </div>
      )}

      {plot && plot.journal.length > 0 && (
        <div className="status-panel__section">
          <h4 className="section-title">
            <BookOpen size={14} /> 种植日志（{plot.journal.length}）
          </h4>
          <ul className="journal-list">
            {plot.journal.map(j => (
              <li key={j.id}>
                <div className="journal-head">
                  <b>{j.cropName}</b>
                  <span className="journal-date">{j.plantDate}</span>
                </div>
                {j.waterNote && <p className="journal-note">{j.waterNote}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};

function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default StatusPanel;
