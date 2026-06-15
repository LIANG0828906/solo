import { useRef, useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface ChartCardConfig {
  id: string;
  type: 'line' | 'bar' | 'heatmap';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  hidden: boolean;
}

interface ChartCardProps {
  config: ChartCardConfig;
  data: unknown[];
  isDragging?: boolean;
  onDragStart?: (id: string, e: React.MouseEvent) => void;
  onResizeStart?: (id: string, e: React.MouseEvent, direction: string) => void;
  onClick?: (dataPoint: unknown) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  isTransitioning?: boolean;
}

const GRADIENT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#14b8a6', '#2dd4bf'];

function ChartCard({
  config,
  data,
  isDragging,
  onDragStart,
  onResizeStart,
  onClick,
  onContextMenu,
  isTransitioning,
}: ChartCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState<unknown | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.resize-handle')) return;
      if (onDragStart && !config.pinned) {
        e.preventDefault();
        onDragStart(config.id, e);
      }
    },
    [config.id, config.pinned, onDragStart]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.stopPropagation();
      e.preventDefault();
      if (onResizeStart && !config.pinned) {
        onResizeStart(config.id, e, direction);
      }
    },
    [config.id, config.pinned, onResizeStart]
  );

  const handleChartClick = useCallback(
    (chartData: unknown) => {
      if (chartData && typeof chartData === 'object' && 'activePayload' in chartData) {
        const payload = (chartData as { activePayload?: { payload: unknown }[] }).activePayload;
        if (payload && payload[0]) {
          setHoveredData(payload[0].payload);
          if (onClick) {
            onClick(payload[0].payload);
          }
        }
      }
    },
    [onClick]
  );

  const renderChart = () => {
    const chartData = data as Record<string, unknown>[];

    switch (config.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              onClick={handleChartClick}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              onClick={handleChartClick}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="category"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor="pointer">
                {chartData.map((_entry, index) => (
                  <Cell
                    key={index}
                    fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'heatmap':
        return <HeatmapChart data={chartData} onClick={handleChartClick} />;

      default:
        return null;
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`chart-card ${isDragging ? 'dragging' : ''} ${
          isTransitioning ? 'transitioning' : ''
        } ${config.pinned ? 'pinned' : ''}`}
        style={{
          position: 'absolute',
          left: config.x,
          top: config.y,
          width: config.width,
          height: config.height,
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={onContextMenu}
      >
        <div className="card-header">
          <span className="card-title">{config.title}</span>
          {config.pinned && <span className="pin-icon">📌</span>}
        </div>
        <div className="chart-container">{renderChart()}</div>

        {!config.pinned && (
          <>
            <div
              className="resize-handle resize-br"
              onMouseDown={(e) => handleResizeStart(e, 'br')}
            />
            <div
              className="resize-handle resize-r"
              onMouseDown={(e) => handleResizeStart(e, 'r')}
            />
            <div
              className="resize-handle resize-b"
              onMouseDown={(e) => handleResizeStart(e, 'b')}
            />
          </>
        )}
      </div>

      <style>{`
        .chart-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          cursor: move;
          transition: box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
          user-select: none;
        }
        .chart-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .chart-card.dragging {
          opacity: 0.9;
          z-index: 100;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .chart-card.transitioning {
          transition: all 0.5s ease;
        }
        .chart-card.pinned {
          cursor: default;
        }
        .card-header {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        .pin-icon {
          font-size: 14px;
        }
        .chart-container {
          flex: 1;
          padding: 8px;
          min-height: 0;
        }
        .resize-handle {
          position: absolute;
          z-index: 10;
        }
        .resize-br {
          right: 0;
          bottom: 0;
          width: 16px;
          height: 16px;
          cursor: nwse-resize;
          background: linear-gradient(135deg, transparent 50%, #6366f1 50%);
          border-radius: 0 0 12px 0;
        }
        .resize-r {
          right: 0;
          top: 0;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
        }
        .resize-b {
          left: 0;
          bottom: 0;
          width: 100%;
          height: 6px;
          cursor: ns-resize;
        }
      `}</style>
    </>
  );
}

function HeatmapChart({
  data,
  onClick,
}: {
  data: Record<string, unknown>[];
  onClick: (data: unknown) => void;
}) {
  const regions = Array.from(new Set(data.map((d) => d.region as string)));
  const hours = Array.from(new Set(data.map((d) => d.hour as number))).sort(
    (a, b) => a - b
  );

  const maxValue = Math.max(...data.map((d) => d.value as number));

  const getColor = (value: number) => {
    const ratio = value / maxValue;
    if (ratio < 0.2) return '#e0e7ff';
    if (ratio < 0.4) return '#a5b4fc';
    if (ratio < 0.6) return '#818cf8';
    if (ratio < 0.8) return '#6366f1';
    return '#4338ca';
  };

  const handleCellClick = (item: Record<string, unknown>) => {
    onClick({
      activePayload: [{ payload: item }],
    });
  };

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-y-labels">
        {regions.map((region) => (
          <div key={region} className="heatmap-y-label">
            {region}
          </div>
        ))}
      </div>
      <div className="heatmap-content">
        <div className="heatmap-x-labels">
          {hours.filter((_, i) => i % 3 === 0).map((hour) => (
            <div key={hour} className="heatmap-x-label">
              {hour}时
            </div>
          ))}
        </div>
        <div className="heatmap-grid">
          {regions.map((region) => (
            <div key={region} className="heatmap-row">
              {hours.map((hour) => {
                const item = data.find(
                  (d) => d.region === region && d.hour === hour
                );
                const value = item ? (item.value as number) : 0;
                return (
                  <div
                    key={`${region}-${hour}`}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(value) }}
                    onClick={() => item && handleCellClick(item)}
                    title={`${region} ${hour}时: ${value}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .heatmap-wrapper {
          display: flex;
          height: 100%;
          gap: 8px;
        }
        .heatmap-y-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          padding-top: 20px;
        }
        .heatmap-y-label {
          font-size: 10px;
          color: #94a3b8;
          text-align: right;
          padding-right: 4px;
        }
        .heatmap-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .heatmap-x-labels {
          display: flex;
          justify-content: space-between;
          padding-bottom: 4px;
        }
        .heatmap-x-label {
          font-size: 10px;
          color: #94a3b8;
        }
        .heatmap-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .heatmap-row {
          flex: 1;
          display: flex;
          gap: 2px;
        }
        .heatmap-cell {
          flex: 1;
          border-radius: 2px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .heatmap-cell:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          z-index: 1;
        }
      `}</style>
    </div>
  );
}

export default ChartCard;
