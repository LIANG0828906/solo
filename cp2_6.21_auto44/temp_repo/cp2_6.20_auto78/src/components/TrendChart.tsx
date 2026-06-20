import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  SentimentDataPoint,
  PlatformTrendPoint,
  Platform,
  platformColors,
  platformNames,
  sentimentColors,
  useDataStore,
} from '../store/useDataStore';

interface TrendChartProps {
  sentimentData: SentimentDataPoint[];
  platformTrendData: PlatformTrendPoint[];
}

const TrendChart: React.FC<TrendChartProps> = ({ sentimentData, platformTrendData }) => {
  const { hiddenPlatforms, togglePlatformVisibility } = useDataStore();

  const platforms: Platform[] = ['weibo', 'zhihu', 'baidu', 'twitter'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: 'rgba(15, 25, 35, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '10px',
            color: '#e2e8f0',
            fontSize: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ marginBottom: '6px', fontWeight: 600 }}>{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: entry.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ opacity: 0.9 }}>{entry.name}:</span>
              <span style={{ fontWeight: 600, color: entry.color }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
        {payload.map((entry: any, index: number) => {
          const platformKey = entry.dataKey as Platform;
          const isHidden = hiddenPlatforms.includes(platformKey);
          return (
            <div
              key={`legend-${index}`}
              onClick={() => togglePlatformVisibility(platformKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                opacity: isHidden ? 0.4 : 1,
                fontSize: '11px',
                transition: 'opacity 0.2s',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '3px',
                  background: entry.color,
                  borderRadius: '1px',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: '#94a3b8' }}>{platformNames[platformKey] || entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const visiblePlatformData = useMemo(() => {
    return platformTrendData.map(item => {
      const newItem: any = { time: item.time };
      platforms.forEach(p => {
        if (!hiddenPlatforms.includes(p)) {
          newItem[p] = item[p];
        }
      });
      return newItem;
    });
  }, [platformTrendData, hiddenPlatforms]);

  const chartStyle = {
    background: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  };

  const axisProps = {
    tick: { fill: '#94a3b8', fontSize: 11 },
    axisLine: { stroke: 'rgba(255,255,255,0.1)' },
    tickLine: { stroke: 'rgba(255,255,255,0.1)' },
  };

  return (
    <div style={{ display: 'flex', gap: '16px', width: '100%', height: '100%' }}>
      <div style={{ ...chartStyle, flex: 1 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#e2e8f0' }}>
          情感趋势堆叠图
        </h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sentimentData}
              margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
            >
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sentimentColors.positive} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={sentimentColors.positive} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sentimentColors.negative} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={sentimentColors.negative} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sentimentColors.neutral} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={sentimentColors.neutral} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value: string) => {
                  const names: Record<string, string> = {
                    positive: '正面',
                    negative: '负面',
                    neutral: '中性',
                  };
                  return names[value] || value;
                }}
              />
              <Area
                type="monotone"
                dataKey="positive"
                stackId="1"
                stroke={sentimentColors.positive}
                fill="url(#colorPositive)"
                strokeWidth={2}
                isAnimationActive
                animationDuration={600}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke={sentimentColors.neutral}
                fill="url(#colorNeutral)"
                strokeWidth={2}
                isAnimationActive
                animationDuration={600}
              />
              <Area
                type="monotone"
                dataKey="negative"
                stackId="1"
                stroke={sentimentColors.negative}
                fill="url(#colorNegative)"
                strokeWidth={2}
                isAnimationActive
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...chartStyle, flex: 1 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#e2e8f0' }}>
          平台词频趋势
        </h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={visiblePlatformData}
              margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {platforms.map(platform => (
                !hiddenPlatforms.includes(platform) && (
                  <Line
                    key={platform}
                    type="monotone"
                    dataKey={platform}
                    stroke={platformColors[platform]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                    isAnimationActive
                    animationDuration={600}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
