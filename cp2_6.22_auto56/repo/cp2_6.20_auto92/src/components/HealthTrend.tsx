import React, { memo, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceDot,
} from 'recharts';
import { TrendPoint, METRIC_OPTIONS } from '../types';

interface HealthTrendProps {
  trends: Record<string, TrendPoint[]>;
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  highlightDate?: string;
}

const HealthTrend: React.FC<HealthTrendProps> = memo(function HealthTrend({
  trends,
  selectedMetric,
  onMetricChange,
  highlightDate,
}) {
  const data = useMemo(() => {
    const points = trends[selectedMetric] || [];
    return points.map((p) => ({
      ...p,
      dateLabel: p.date.slice(5),
      isHighlighted: p.date === highlightDate,
    }));
  }, [trends, selectedMetric, highlightDate]);

  const highlightPoint = useMemo(() => {
    return data.find((d) => d.isHighlighted);
  }, [data]);

  if (!trends || Object.keys(trends).length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>
        暂无趋势数据
      </div>
    );
  }

  return (
    <div className="fade-data">
      <div className="metric-selector">
        {METRIC_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`metric-btn ${selectedMetric === opt.key ? 'active' : ''}`}
            onClick={() => onMetricChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#718096', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#718096', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              width={55}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const d = payload[0].payload;
                  return (
                    <div
                      style={{
                        background: 'white',
                        padding: '10px 14px',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>
                        {d.date}
                      </div>
                      <div style={{ fontWeight: 600, color: '#2b6cb0' }}>
                        {d.value}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2b6cb0"
              strokeWidth={2.5}
              dot={{ fill: '#2b6cb0', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#2b6cb0', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={300}
            />
            {highlightPoint && (
              <ReferenceDot
                x={highlightPoint.dateLabel}
                y={highlightPoint.value}
                r={8}
                fill="#e53e3e"
                stroke="#fff"
                strokeWidth={2}
              />
            )}
            <Brush
              dataKey="dateLabel"
              height={24}
              stroke="#2b6cb0"
              fill="#f7fafc"
              travellerWidth={10}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default HealthTrend;
