import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { MoodTrend, EmotionType } from '../shared/types';
import { getMoodTrends } from './VisualizationModule';
import { emotionConfigs } from '../tracker/TrackerModule';
import './TrendChart.css';

interface TrendChartProps {
  refreshTrigger: number;
}

const timeRanges = [
  { label: '7天', days: 7 },
  { label: '30天', days: 30 },
  { label: '90天', days: 90 }
];

const TrendChart: React.FC<TrendChartProps> = ({ refreshTrigger }) => {
  const [selectedRange, setSelectedRange] = useState(7);
  const [trends, setTrends] = useState<MoodTrend[]>([]);
  const [hiddenEmotions, setHiddenEmotions] = useState<Set<EmotionType>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getMoodTrends(selectedRange);
        setTrends(data);
      } catch (err) {
        console.error('加载趋势数据失败:', err);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      }
    };
    loadData();
  }, [selectedRange, refreshTrigger]);

  const handleRangeChange = useCallback((days: number) => {
    setSelectedRange(days);
  }, []);

  const toggleEmotion = useCallback((emotion: EmotionType) => {
    setHiddenEmotions(prev => {
      const next = new Set(prev);
      if (next.has(emotion)) {
        next.delete(emotion);
      } else {
        next.add(emotion);
      }
      return next;
    });
  }, []);

  const chartData = useMemo(() => {
    return trends.map(trend => {
      const date = new Date(trend.date);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      return {
        ...trend,
        formattedDate,
        avgIntensity: Math.round(trend.avgIntensity * 10) / 10
      };
    });
  }, [trends]);

  const emotions = Object.entries(emotionConfigs) as [EmotionType, typeof emotionConfigs[EmotionType]][];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; dataKey: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-date">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="tooltip-item" style={{ color: entry.color }}>
            {entry.dataKey}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  const renderLegend = (props: { payload?: Array<{ dataKey?: string | number; color?: string; value?: string }> }) => {
    const { payload } = props;
    if (!payload) return null;
    return (
      <div className="custom-legend">
        {payload.map((entry, index) => {
          const dataKey = String(entry.dataKey || '');
          const emotionType = dataKey as EmotionType;
          const isHidden = hiddenEmotions.has(emotionType);
          const config = emotionConfigs[emotionType];
          return (
            <button
              key={index}
              className={`legend-item ${isHidden ? 'hidden' : ''}`}
              onClick={() => toggleEmotion(emotionType)}
              type="button"
            >
              <span className="legend-emoji">{config?.emoji || ''}</span>
              <span className="legend-text" style={{ color: entry.color }}>
                {config?.label || dataKey}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="trend-chart">
      <h2 className="section-title">
        <span className="title-icon">📈</span>
        情绪趋势
      </h2>

      <div className="glass-card">
        <div className="chart-header">
          <div className="range-buttons">
            {timeRanges.map(range => (
              <button
                key={range.days}
                className={`range-button ${selectedRange === range.days ? 'active' : ''}`}
                onClick={() => handleRangeChange(range.days)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`chart-container ${isVisible ? 'visible' : ''}`}>
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 156, 246, 0.2)" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#8a8aa8"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(139, 156, 246, 0.3)' }}
                />
                <YAxis 
                  stroke="#8a8aa8"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(139, 156, 246, 0.3)' }}
                  domain={[0, 10]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />
                
                <Line
                  type="monotone"
                  dataKey="avgIntensity"
                  stroke="url(#intensityGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#8b9cf6', r: 4 }}
                  activeDot={{ r: 6, fill: '#b794f6' }}
                  name="情绪指数"
                  animationDuration={800}
                  animationEasing="ease-out"
                />

                {emotions.map(([type, config]) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={(data) => data.emotionCounts[type] || 0}
                    stroke={config.color}
                    strokeWidth={2}
                    dot={false}
                    name={config.label}
                    hide={hiddenEmotions.has(type)}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                ))}

                <defs>
                  <linearGradient id="intensityGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b9cf6" />
                    <stop offset="100%" stopColor="#b794f6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
