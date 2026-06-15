import React, { useState, useEffect, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { HistoryData, PollutantType, TimeRange, Theme } from '../types';
import { POLLUTANT_COLORS, POLLUTANT_UNITS } from '../types';

interface TrendChartProps {
  data: HistoryData;
  timeRange: TimeRange;
  theme: Theme;
  onTimeRangeChange: (range: TimeRange) => void;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24小时' },
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
];

function getCssVar(varName: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  return '';
}

export function TrendChart({ data, timeRange, theme, onTimeRangeChange }: TrendChartProps) {
  const [hiddenPollutants, setHiddenPollutants] = useState<Set<PollutantType>>(new Set());
  const [animateKey, setAnimateKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayData, setDisplayData] = useState(data);
  const [colorKey, setColorKey] = useState(0);

  const pollutants: PollutantType[] = ['PM2.5', 'PM10', 'O3', 'NO2', 'CO', 'SO2'];

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setDisplayData(data);
      setAnimateKey((prev) => prev + 1);
      setIsAnimating(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [timeRange, data]);

  useEffect(() => {
    setColorKey((prev) => prev + 1);
  }, [theme]);

  const chartData = useMemo(() => {
    const firstPollutant = pollutants.find((p) => !hiddenPollutants.has(p)) || 'PM2.5';
    const baseData = displayData[firstPollutant] || [];

    return baseData.map((point, index) => {
      const row: Record<string, string | number> = { time: point.time };
      pollutants.forEach((p) => {
        if (displayData[p] && displayData[p][index]) {
          row[p] = displayData[p][index].value;
        }
      });
      return row;
    });
  }, [displayData, hiddenPollutants]);

  const togglePollutant = (pollutant: PollutantType) => {
    setHiddenPollutants((prev) => {
      const next = new Set(prev);
      if (next.has(pollutant)) {
        next.delete(pollutant);
      } else {
        next.add(pollutant);
      }
      return next;
    });
  };

  const themeColors = useMemo(() => ({
    grid: getCssVar('--chart-grid') || (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
    axis: getCssVar('--chart-axis') || (theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
    tooltipBg: getCssVar('--chart-tooltip-bg') || (theme === 'dark' ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)'),
    tooltipBorder: getCssVar('--chart-tooltip-border') || (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'),
    textPrimary: getCssVar('--text-primary') || (theme === 'dark' ? '#ffffff' : '#1a1a1a'),
    textMuted: getCssVar('--text-muted') || (theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
  }), [theme, colorKey]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: themeColors.tooltipBg,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${themeColors.tooltipBorder}`,
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
          }}
        >
          <p style={{ color: themeColors.textPrimary, fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, fontSize: '12px', margin: '4px 0' }}>
              {entry.dataKey}: {entry.value} {POLLUTANT_UNITS[entry.dataKey as PollutantType]}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container" key={colorKey}>
      <div className="chart-controls">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            className={`chart-tab ${timeRange === range.value ? 'active' : ''}`}
            onClick={() => onTimeRangeChange(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div
        key={animateKey}
        className="chart-wrapper"
        style={{
          width: '100%',
          height: 280,
          opacity: isAnimating ? 0 : 1,
          transform: `scaleX(${isAnimating ? 0.3 : 1})`,
          transformOrigin: 'center',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {pollutants.map((p) => (
                <linearGradient key={p} id={`gradient-${p}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={POLLUTANT_COLORS[p]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={POLLUTANT_COLORS[p]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
            <XAxis
              dataKey="time"
              tick={{ fill: themeColors.textMuted, fontSize: 11 }}
              axisLine={{ stroke: themeColors.axis }}
              tickLine={{ stroke: themeColors.axis }}
            />
            <YAxis
              tick={{ fill: themeColors.textMuted, fontSize: 11 }}
              axisLine={{ stroke: themeColors.axis }}
              tickLine={{ stroke: themeColors.axis }}
            />
            <Tooltip content={<CustomTooltip />} />
            {pollutants.map((p) => (
              <Area
                key={p}
                type="monotone"
                dataKey={p}
                stroke={POLLUTANT_COLORS[p]}
                strokeWidth={2}
                fill={`url(#gradient-${p})`}
                hide={hiddenPollutants.has(p)}
                animationDuration={600}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        {pollutants.map((p) => (
          <div
            key={p}
            className={`legend-item ${hiddenPollutants.has(p) ? 'disabled' : ''}`}
            onClick={() => togglePollutant(p)}
          >
            <span
              className="legend-dot"
              style={{
                backgroundColor: POLLUTANT_COLORS[p],
                transition: 'background-color 0.5s ease',
              }}
            />
            <span style={{ transition: 'color 0.5s ease' }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
