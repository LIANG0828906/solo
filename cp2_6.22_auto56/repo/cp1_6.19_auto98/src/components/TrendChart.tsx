import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FaChartBar, FaTags } from 'react-icons/fa';
import { useFeedback } from '../store/feedbackReducer';
import {
  calculateTrend,
  TimeRange,
  TrendResult,
  formatAxisDate,
  TrendPoint,
} from '../services/trendCalculator';

const RANGES: { key: TimeRange; label: string }[] = [
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: 'all', label: '全部' },
];

interface ChartDimensions {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
};

const TrendChart: React.FC = () => {
  const { state } = useFeedback();
  const [range, setRange] = useState<TimeRange>('7d');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const prevDataRef = useRef<TrendPoint[]>([]);
  const prevMaxRef = useRef<number>(0);
  const progressRef = useRef<number>(1);
  const lastFrameRef = useRef<number>(0);

  const trendResult = useMemo(
    () => calculateTrend(state.feedbacks, range),
    [state.feedbacks, range]
  );

  const dimensions: ChartDimensions = {
    width: 800,
    height: 360,
    padding: { top: 40, right: 24, bottom: 60, left: 44 },
  };

  const activeTagsSorted = useMemo(() => {
    const tagTotals: Record<string, number> = {};
    trendResult.points.forEach((p) => {
      Object.entries(p.counts).forEach(([k, v]) => {
        tagTotals[k] = (tagTotals[k] || 0) + v;
      });
    });
    return Object.entries(tagTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
  }, [trendResult.points]);

  const maxValue = useMemo(() => {
    let max = 0;
    trendResult.points.forEach((p) => {
      if (p.total > max) max = p.total;
    });
    return Math.max(5, Math.ceil(max * 1.1));
  }, [trendResult.points]);

  const getChartSize = useCallback(() => {
    if (!containerRef.current) return { w: 800, h: 360 };
    const rect = containerRef.current.getBoundingClientRect();
    const w = Math.max(320, rect.width);
    const h = 360;
    return { w, h };
  }, []);

  const setupCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      const canvas = canvasRef.current!;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    []
  );

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const drawChart = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { w, h } = getChartSize();
      const dims: ChartDimensions = {
        width: w,
        height: h,
        padding: dimensions.padding,
      };
      setupCanvas(ctx, w, h);

      ctx.clearRect(0, 0, w, h);

      const chartW = dims.width - dims.padding.left - dims.padding.right;
      const chartH = dims.height - dims.padding.top - dims.padding.bottom;

      ctx.strokeStyle = '#ECF0F1';
      ctx.lineWidth = 1;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#95A5A6';
      ctx.textBaseline = 'middle';

      const yTicks = 5;
      const prevMax = prevMaxRef.current || maxValue;
      const currentMax = lerp(prevMax, maxValue, progress);
      for (let i = 0; i <= yTicks; i++) {
        const y =
          dims.padding.top + (chartH * i) / yTicks;
        const val = Math.round(currentMax * (1 - i / yTicks));
        ctx.beginPath();
        ctx.moveTo(dims.padding.left, y);
        ctx.lineTo(dims.width - dims.padding.right, y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(String(val), dims.padding.left - 8, y);
      }

      const points = trendResult.points;
      const prevPoints = prevDataRef.current;
      const n = points.length;
      if (n === 0) return;

      const barGroupWidth = n > 1 ? chartW / n : chartW * 0.6;
      const barGroupX = (xIdx: number) =>
        dims.padding.left +
        (n > 1 ? xIdx * barGroupWidth + barGroupWidth * 0.1 : chartW * 0.2);

      const prevCountsFor = (idx: number, tag: string) => {
        const prev = prevPoints[idx];
        if (!prev) return 0;
        return prev.counts[tag] || 0;
      };

      const tags = activeTagsSorted;
      const tagsInBars = Math.max(1, tags.length);
      const barWidth =
        Math.min(
          18,
          (barGroupWidth * 0.8) / Math.max(1, tagsInBars)
        );
      const totalBarsWidth = barWidth * tagsInBars;
      const groupStartOffset =
        barGroupWidth * 0.1 + (barGroupWidth * 0.8 - totalBarsWidth) / 2;

      for (let i = 0; i < n; i++) {
        const point = points[i];
        const groupX = barGroupX(i);

        const prevPointTotal =
          prevPoints[i]?.total || 0;
        const curTotal = lerp(prevPointTotal, point.total, progress);

        if (tags.length === 0) {
          const bx = groupX + groupStartOffset;
          const bh = (curTotal / currentMax) * chartH;
          const by = dims.padding.top + chartH - bh;
          ctx.fillStyle = '#BDC3C7';
          ctx.fillRect(bx, by, barWidth, bh);
          if (curTotal > 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(
              String(Math.round(curTotal)),
              bx + barWidth / 2,
              by - 6
            );
          }
        } else {
          tags.forEach((tag, tagIdx) => {
            const curVal = lerp(
              prevCountsFor(i, tag),
              point.counts[tag] || 0,
              progress
            );
            const color = trendResult.tagColors[tag] || '#95A5A6';
            const bx = groupX + groupStartOffset + tagIdx * barWidth;
            const bh = (curVal / currentMax) * chartH;
            const by = dims.padding.top + chartH - bh;
            ctx.fillStyle = color;
            const radius = Math.min(4, barWidth / 3);
            roundRect(ctx, bx, by, barWidth, bh, radius);
            ctx.fill();
            if (curVal > 0) {
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'alphabetic';
              ctx.fillText(
                String(Math.round(curVal)),
                bx + barWidth / 2,
                by - 5
              );
            }
          });
        }

        ctx.save();
        ctx.fillStyle = '#7F8C8D';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const labelX = groupX + barGroupWidth / 2;
        const labelY = dims.padding.top + chartH + 12;
        ctx.translate(labelX + 4, labelY);
        const label = formatAxisDate(point.date, range);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }

      ctx.strokeStyle = '#BDC3C7';
      ctx.beginPath();
      ctx.moveTo(dims.padding.left, dims.padding.top + chartH);
      ctx.lineTo(
        dims.width - dims.padding.right,
        dims.padding.top + chartH
      );
      ctx.stroke();
    },
    [
      trendResult,
      activeTagsSorted,
      maxValue,
      range,
      dimensions.padding,
      getChartSize,
      setupCanvas,
    ]
  );

  useEffect(() => {
    const animate = (ts: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = ts;
      const delta = ts - lastFrameRef.current;
      lastFrameRef.current = ts;
      const duration = 400;
      progressRef.current = Math.min(
        1,
        progressRef.current + delta / duration
      );
      drawChart(progressRef.current);
      if (progressRef.current < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        prevDataRef.current = trendResult.points;
        prevMaxRef.current = maxValue;
      }
    };
    progressRef.current = 0;
    lastFrameRef.current = 0;
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [trendResult.points, maxValue, drawChart]);

  useEffect(() => {
    const handleResize = () => {
      drawChart(1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  return (
    <div className="trend-container">
      <style>{trendStyles}</style>

      <div className="trend-header">
        <h2 className="page-title">趋势分析</h2>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon total">
              <FaChartBar />
            </div>
            <div className="stat-info">
              <div className="stat-value">{trendResult.totalCount}</div>
              <div className="stat-label">总反馈数</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon tags">
              <FaTags />
            </div>
            <div className="stat-info">
              <div className="stat-value">{trendResult.activeTags.length}</div>
              <div className="stat-label">活跃标签数</div>
            </div>
          </div>
        </div>
      </div>

      <div className="range-switch">
        <div className="range-group">
          {RANGES.map((r) => (
            <button
              key={r.key}
              className={`range-btn ${range === r.key ? 'active' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="legend-row">
        {activeTagsSorted.map((tag) => (
          <div key={tag} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: trendResult.tagColors[tag] }}
            ></span>
            <span className="legend-name">{tag}</span>
          </div>
        ))}
      </div>

      <div className="chart-wrapper" ref={containerRef}>
        <canvas ref={canvasRef} className="chart-canvas" />
        {trendResult.totalCount === 0 && (
          <div className="chart-empty">
            <FaChartBar className="empty-icon" />
            <p>暂无数据，添加反馈后查看趋势</p>
          </div>
        )}
      </div>
    </div>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (h < r * 2) r = h / 2;
  if (w < r * 2) r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default TrendChart;

const trendStyles = `
.trend-container {
  padding: 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stats-row {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #F7F9FC;
  border-radius: 10px;
  min-width: 130px;
  border: 1px solid #ECF0F1;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.stat-icon.total {
  background: linear-gradient(135deg, #2C3E50, #34495E);
  color: white;
}

.stat-icon.tags {
  background: linear-gradient(135deg, #1ABC9C, #16A085);
  color: white;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #2C3E50;
  line-height: 1.1;
}

.stat-label {
  font-size: 12px;
  color: #7F8C8D;
  margin-top: 2px;
}

.range-switch {
  margin-bottom: 16px;
}

.range-group {
  display: inline-flex;
  background: #F7F9FC;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #ECF0F1;
}

.range-btn {
  border: none;
  background: transparent;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #7F8C8D;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease-out;
  font-family: inherit;
}

.range-btn:hover {
  color: #2C3E50;
}

.range-btn.active {
  background: linear-gradient(135deg, #2C3E50, #1ABC9C);
  color: white;
  box-shadow: 0 2px 8px rgba(44,62,80,0.2);
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  min-height: 20px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #34495E;
  font-weight: 500;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.chart-wrapper {
  position: relative;
  background: white;
  border: 1px solid #ECF0F1;
  border-radius: 12px;
  padding: 16px;
  overflow: hidden;
}

.chart-canvas {
  width: 100%;
  display: block;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #BDC3C7;
  gap: 12px;
  pointer-events: none;
}

.chart-empty .empty-icon {
  font-size: 48px;
  opacity: 0.4;
}

.chart-empty p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .trend-container {
    padding: 16px;
  }

  .trend-header {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-row {
    width: 100%;
  }

  .stat-card {
    flex: 1;
    min-width: 0;
  }
}
`;
