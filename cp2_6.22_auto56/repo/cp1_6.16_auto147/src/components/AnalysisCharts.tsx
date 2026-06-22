import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store';

interface ChartDataPoint {
  x: number;
  温度: number | null;
  湿度: number | null;
  风速: number | null;
}

export function AnalysisCharts() {
  const simulationResult = useAppStore((s) => s.simulationResult);
  const blockConfig = useAppStore((s) => s.blockConfig);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!simulationResult) return [];

    const { tempProfile, humidityProfile, windProfile } = simulationResult;
    const data: ChartDataPoint[] = [];
    const len = Math.max(tempProfile.length, humidityProfile.length, windProfile.length);

    for (let i = 0; i < len; i++) {
      const xRatio = len > 1 ? i / (len - 1) : 0.5;
      data.push({
        x: Number((xRatio * blockConfig.width).toFixed(1)),
        温度: tempProfile[i] !== undefined ? Number(tempProfile[i].toFixed(1)) : null,
        湿度: humidityProfile[i] !== undefined ? Number(humidityProfile[i].toFixed(1)) : null,
        风速: windProfile[i] !== undefined ? Number(windProfile[i].toFixed(2)) : null,
      });
    }

    return data;
  }, [simulationResult, blockConfig.width]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { name: string; value: number | null; color: string }[];
    label?: number | string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">位置：{label} m</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
              {entry.name}：{entry.value !== null ? entry.value : '-'}
              {entry.name === '温度' && ' ℃'}
              {entry.name === '湿度' && ' %'}
              {entry.name === '风速' && ' m/s'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!simulationResult) {
    return (
      <div className="charts-container">
        <div className="charts-placeholder">
          <p>点击"开始模拟"查看微气候分析图表</p>
        </div>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <div className="charts-header">
        <h3 className="charts-title">微气候剖面分析</h3>
        <p className="charts-subtitle">沿街区宽度方向的指标变化曲线</p>
      </div>
      <div className="charts-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis
              dataKey="x"
              stroke="#888888"
              tick={{ fill: '#aaa', fontSize: 12 }}
              label={{ value: '街区宽度 (m)', position: 'insideBottom', offset: -10, fill: '#888', fontSize: 12 }}
            />
            <YAxis
              yAxisId="temp"
              stroke="#FF7043"
              tick={{ fill: '#aaa', fontSize: 12 }}
              domain={['auto', 'auto']}
              width={60}
            />
            <YAxis
              yAxisId="humidity"
              orientation="right"
              stroke="#4FC3F7"
              tick={{ fill: '#aaa', fontSize: 12 }}
              domain={['auto', 'auto']}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value: string) => (
                <span style={{ color: '#ccc', fontSize: 13 }}>{value}</span>
              )}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="温度"
              stroke="#FF7043"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              filter="url(#glow-temp)"
            />
            <Line
              yAxisId="humidity"
              type="monotone"
              dataKey="湿度"
              stroke="#4FC3F7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              filter="url(#glow-humidity)"
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="风速"
              stroke="#66BB6A"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              filter="url(#glow-wind)"
            />
            <defs>
              <filter id="glow-temp" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-humidity" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-wind" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
