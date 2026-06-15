import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { DailyAssignment } from '../../types';
import { generateChartData } from '../../utils/calculateProgress';

interface ReadingChartProps {
  dailyAssignments: DailyAssignment[];
  memberProgress: { date: string; pagesRead: number }[];
  memberName: string;
  memberColor: string;
  totalPages: number;
}

export default function ReadingChart({
  dailyAssignments,
  memberProgress,
  memberName,
  memberColor,
  totalPages,
}: ReadingChartProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [memberName]);

  const chartData = useMemo(() => {
    const fullData = generateChartData(dailyAssignments, memberProgress);

    const maxPoints = 30;
    if (fullData.length <= maxPoints) return fullData;

    const step = Math.ceil(fullData.length / maxPoints);
    const sampled: typeof fullData = [];
    for (let i = 0; i < fullData.length; i += step) {
      sampled.push(fullData[i]);
    }
    if (sampled[sampled.length - 1] !== fullData[fullData.length - 1]) {
      sampled.push(fullData[fullData.length - 1]);
    }
    return sampled;
  }, [dailyAssignments, memberProgress]);

  const stats = useMemo(() => {
    const lastPoint = chartData[chartData.length - 1];
    if (!lastPoint) {
      return { planned: 0, actual: 0, diff: 0, diffPercent: 0 };
    }
    const planned = lastPoint.planned;
    const actual = lastPoint.actual;
    const diff = actual - planned;
    const diffPercent = planned > 0 ? Math.round((diff / planned) * 100) : 0;
    return { planned, actual, diff, diffPercent };
  }, [chartData]);

  return (
    <div
      className="glass-card chart-card"
      style={{
        animation: 'fadeInUp 0.5s ease 0.3s both',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div className="chart-header">
        <div>
        <h3 className="chart-title">
          <span className="chart-title-icon">📈</span>
          {memberName} 的阅读进度曲线
        </h3>
        <p className="chart-desc">虚线为目标计划进度，实线为实际阅读进度</p>
        </div>

        <div className="chart-stats-row">
          <MiniStat
            label="计划进度"
            value={`${Math.round((stats.planned / totalPages) * 100)}%`}
            sub={`${stats.planned}/${totalPages}页`}
            color="#667eea"
          />
          <MiniStat
            label="实际进度"
            value={`${Math.round((stats.actual / totalPages) * 100)}%`}
            sub={`${stats.actual}/${totalPages}页`}
            color={memberColor}
          />
          <MiniStat
            label={stats.diff >= 0 ? '超前' : '落后'}
            value={`${Math.abs(stats.diffPercent)}%`}
            sub={`${Math.abs(stats.diff)}页`}
            color={stats.diff >= 0 ? '#48bb78' : '#fc8181'}
          />
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="plannedGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#667eea" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#764ba2" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={memberColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={memberColor} stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,0,0,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#718096' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
              interval="preserveStartEnd"
            />

            <YAxis
              tick={{ fontSize: 12, fill: '#718096' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
              tickFormatter={(value) => `${value}页`}
            />

            <ReferenceLine
              y={totalPages}
              stroke="#48bb78"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: '📖 全书完',
                position: 'right',
                fill: '#48bb78',
                fontSize: 12,
              }}
            />

            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.8)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
              labelStyle={{
                fontWeight: 600,
                color: '#2D3748',
                marginBottom: '8px',
              }}
              formatter={(value: number, name: string) => [
                <span style={{ fontWeight: 600 }}>{value} 页</span>,
                name,
              ]}
            />

            <Legend
              iconType="circle"
              wrapperStyle={{
                paddingTop: '16px',
                fontSize: '13px',
              }}
            />

            <Line
              type="monotone"
              dataKey="planned"
              name="计划进度"
              stroke="#667eea"
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={{
                r: 3,
                fill: '#667eea',
                strokeWidth: 2,
                stroke: '#fff',
              }}
              activeDot={{
                r: 7,
                stroke: '#667eea',
                strokeWidth: 2,
                fill: '#fff',
              }}
            />

            <Line
              type="monotone"
              dataKey="actual"
              name="实际进度"
              stroke={memberColor}
              strokeWidth={3.5}
              dot={{
                r: 4,
                fill: memberColor,
                strokeWidth: 2,
                stroke: '#fff',
              }}
              activeDot={{
                r: 8,
                stroke: memberColor,
                strokeWidth: 3,
                fill: '#fff',
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <LegendItem color="#667eea" dashed label="目标曲线（计划）" />
        <LegendItem color={memberColor} label={`${memberName}的实际阅读`} />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="mini-stat"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}30`,
      }}
    >
      <div className="mini-stat-label">{label}</div>
      <div className="mini-stat-value" style={{ color }}>
        {value}
      </div>
      <div className="mini-stat-sub">{sub}</div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  const bgStyle = dashed
    ? { background: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` }
    : { background: color };

  return (
    <div className="chart-legend-item">
      <div
        className={dashed ? 'chart-legend-line-dashed' : 'chart-legend-line'}
        style={bgStyle}
      />
      <span className="chart-legend-label">{label}</span>
    </div>
  );
}
