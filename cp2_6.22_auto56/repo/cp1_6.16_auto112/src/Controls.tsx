import { useRef, useEffect } from 'react';
import { TrafficSimulation, CongestionDataPoint } from './simulation';

interface ControlsProps {
  simulation: TrafficSimulation;
  isRunning: boolean;
  speed: number;
  onToggleRunning: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function Controls({
  simulation,
  isRunning,
  speed,
  onToggleRunning,
  onReset,
  onSpeedChange,
}: ControlsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawChart = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const padding = { top: 10, right: 10, bottom: 25, left: 35 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      roundRect(ctx, 0, 0, w, h, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${100 - i * 25}`, padding.left - 5, y);
      }

      const data: CongestionDataPoint[] = simulation.congestionHistory;
      if (data.length < 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('等待数据...', w / 2, h / 2);
        return;
      }

      const maxTime = Math.max(30, data[data.length - 1].time);
      const minTime = Math.max(0, maxTime - 250);

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < data.length; i++) {
        const point = data[i];
        if (point.time < minTime) continue;

        const x = padding.left + ((point.time - minTime) / (maxTime - minTime)) * chartW;
        const y = padding.top + (1 - point.avgCongestionIndex / 100) * chartH;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }

      const gradient = ctx.createLinearGradient(padding.left, padding.top, w - padding.right, padding.top);
      gradient.addColorStop(0, '#2ECC71');
      gradient.addColorStop(0.5, '#F1C40F');
      gradient.addColorStop(1, '#E74C3C');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('时间(s)', w / 2, h - 12);

      ctx.save();
      ctx.translate(10, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('拥堵指数', 0, 0);
      ctx.restore();
    };

    drawChart();
    const interval = setInterval(drawChart, 500);
    const ro = new ResizeObserver(drawChart);
    if (chartRef.current) ro.observe(chartRef.current);

    return () => {
      clearInterval(interval);
      ro.disconnect();
    };
  }, [simulation]);

  const speedMarks = [0.5, 1, 2, 3, 4];

  return (
    <div className="controls-panel">
      <h2 className="panel-title">控制面板</h2>

      <div className="control-section">
        <div className="button-row">
          <button
            className={`play-btn ${isRunning ? 'running' : ''}`}
            onClick={onToggleRunning}
            title={isRunning ? '暂停' : '开始'}
          >
            {isRunning ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button className="reset-btn" onClick={onReset} title="重置">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="control-section">
        <div className="speed-header">
          <span className="speed-label">模拟速度</span>
          <span className="speed-value">{speed.toFixed(1)}x</span>
        </div>
        <div className="slider-container">
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="speed-slider"
          />
          <div className="slider-marks">
            {speedMarks.map((mark) => (
              <span key={mark} className="slider-mark" />
            ))}
          </div>
          <div className="slider-labels">
            <span>0.5x</span>
            <span>1x</span>
            <span>2x</span>
            <span>3x</span>
            <span>4x</span>
          </div>
        </div>
      </div>

      <div className="control-section">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">车辆数</span>
            <span className="stat-value">{simulation.vehicles.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">公交线路</span>
            <span className="stat-value">{simulation.busRoutes.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">模拟时间</span>
            <span className="stat-value">{Math.floor(simulation.simulationTime)}s</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">平均拥堵</span>
            <span className="stat-value">
              {simulation.intersections.length > 0
                ? Math.round(
                    simulation.intersections.reduce((s, i) => s + i.congestionLevel * 100, 0) /
                      simulation.intersections.length
                  )
                : 0}
              %
            </span>
          </div>
        </div>
      </div>

      <div className="control-section chart-section">
        <span className="chart-title">拥堵指数趋势</span>
        <canvas ref={chartRef} className="congestion-chart" />
      </div>

      <div className="control-section legend-section">
        <span className="legend-title">图例说明</span>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot residential" />
            <span>住宅区</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot commercial" />
            <span>商业区</span>
          </div>
          <div className="legend-item">
            <span className="legend-line bus" />
            <span>公交线路</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot blue" />
            <span>四相位灯</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot purple" />
            <span>两相位灯</span>
          </div>
        </div>
        <p className="legend-tip">
          点击路口选择，再点击另一路口添加公交线路；点击同一路口切换红绿灯模式
        </p>
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}
