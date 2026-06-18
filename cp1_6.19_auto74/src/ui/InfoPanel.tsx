import { memo, useEffect, useRef } from 'react';
import { GameState } from '../engine/GameState';

interface Props {
  state: GameState;
}

export const InfoPanel = memo(function InfoPanel({ state }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const prevRevenueRef = useRef(state.revenue);
  const flashRef = useRef(0);

  const revenueChanged = state.revenue !== prevRevenueRef.current;
  if (revenueChanged) {
    flashRef.current = 0.3;
  }
  prevRevenueRef.current = state.revenue;
  if (flashRef.current > 0) {
    flashRef.current = Math.max(0, flashRef.current - 0.016);
  }

  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = { top: 10, right: 10, bottom: 20, left: 30 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const data = state.statsHistory;
    const n = data.length;
    if (n < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('数据采集中...', w / 2, h / 2);
      return;
    }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Y-axis labels (satisfaction 0-100)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const val = 100 - i * 25;
      const y = padding.top + (chartH * i) / 4;
      ctx.fillText(`${val}`, padding.left - 3, y);
    }

    // Satisfaction gradient line
    const maxPts = 30;
    const stepX = chartW / Math.max(1, maxPts - 1);

    const drawLine = (getValue: (d: typeof data[0]) => number, maxVal: number, getColor: (val: number) => string, lineWidth: number = 2) => {
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const val = getValue(data[i]);
        const x = padding.left + i * stepX;
        const y = padding.top + chartH * (1 - val / maxVal);
        if (i === 0) ctx.moveTo(x, y);
        else {
          ctx.strokeStyle = getColor(val);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
    };

    // Satisfaction (green->red gradient)
    ctx.lineWidth = 2.5;
    let started = false;
    for (let i = 0; i < n; i++) {
      const val = data[i].satisfaction;
      const x = padding.left + i * stepX;
      const y = padding.top + chartH * (1 - val / 100);
      const r = Math.round(255 * (1 - val / 100));
      const g = Math.round(200 * (val / 100));
      ctx.strokeStyle = `rgb(${r},${g},80)`;
      if (!started) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }

    // Throughput (orange dashed)
    ctx.strokeStyle = '#FFA726';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    started = false;
    const maxThroughput = Math.max(1, ...data.map((d) => d.throughput));
    for (let i = 0; i < n; i++) {
      const val = (data[i].throughput / maxThroughput) * 100;
      const x = padding.left + i * stepX;
      const y = padding.top + chartH * (1 - val / 100);
      if (!started) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Avg wait (cyan)
    ctx.strokeStyle = '#4DD0E1';
    ctx.lineWidth = 1.5;
    started = false;
    const maxWait = Math.max(1, ...data.map((d) => d.avgWait));
    for (let i = 0; i < n; i++) {
      const val = (data[i].avgWait / maxWait) * 100;
      const x = padding.left + i * stepX;
      const y = padding.top + chartH * (1 - val / 100);
      if (!started) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Legend
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    const legendY = h - 6;
    const items = [
      { color: '#4CAF50', label: '满意度' },
      { color: '#FFA726', label: '吞吐量', dash: true },
      { color: '#4DD0E1', label: '等待时间' },
    ];
    let lx = padding.left;
    for (const it of items) {
      ctx.fillStyle = it.color;
      if (it.dash) {
        ctx.setLineDash([3, 3]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, legendY);
      ctx.lineTo(lx + 12, legendY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(it.label, lx + 14, legendY + 3);
      lx += ctx.measureText(it.label).width + 30;
    }
  }, [state.statsHistory]);

  return (
    <div className="info-panel">
      <div className="info-header">📊 实时数据</div>

      <div className="info-grid">
        <div className="info-item">
          <div className="info-label">今日营收</div>
          <div
            className={`info-value revenue ${flashRef.current > 0 ? 'flash' : ''}`}
            key={state.revenue}
          >
            ¥{state.revenue.toFixed(2)}
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">顾客满意度</div>
          <div className="info-value">
            <span
              className="satisfaction-val"
              style={{
                color:
                  state.satisfaction > 70
                    ? '#4CAF50'
                    : state.satisfaction > 40
                    ? '#FFA726'
                    : '#F44336',
              }}
            >
              {state.satisfaction.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">平均等待</div>
          <div className="info-value">{state.avgWaitTime.toFixed(1)}s</div>
        </div>

        <div className="info-item">
          <div className="info-label">吞吐量</div>
          <div className="info-value">{state.throughput}人</div>
        </div>

        <div className="info-item">
          <div className="info-label">在场顾客</div>
          <div className="info-value">{state.customers.length}</div>
        </div>

        <div className="info-item">
          <div className="info-label">游戏时间</div>
          <div className="info-value">{Math.floor(state.time)}s</div>
        </div>
      </div>

      <div className="chart-container">
        <canvas ref={chartRef} width={280} height={110} className="chart-canvas" />
      </div>
    </div>
  );
});
