import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { DashboardTab, BerthEfficiency } from '../../types';
import './Dashboard.css';

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, trend, trendValue, suffix }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [trendBounceKey, setTrendBounceKey] = useState(0);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    const valueChanged = value !== displayValue;
    const isNumericChange = typeof value === 'number' && typeof displayValue === 'number';
    
    if (valueChanged) {
      setPrevValue(displayValue);
      setIsAnimating(true);
      setFlipKey(prev => prev + 1);

      if (isNumericChange) {
        const startValue = displayValue as number;
        const diff = (value as number) - startValue;
        const duration = 600;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(startValue + diff * eased);
          setDisplayValue(current as any);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        setTimeout(() => setIsAnimating(false), 600);
      }
      
      if (trend && trend !== 'stable') {
        setTrendBounceKey(prev => prev + 1);
      }
    } else if (trend && trend !== 'stable') {
      setTrendBounceKey(prev => prev + 1);
    }
  }, [value, trend]);

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? '#2ecc71' : trend === 'down' ? '#e74c3c' : '#95a5a6';
  const valueDirection = typeof value === 'number' && typeof prevValue === 'number'
    ? value > prevValue ? 'up' : value < prevValue ? 'down' : 'stable'
    : 'stable';

  return (
    <div className={`stat-card ${isAnimating ? 'animating' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value-row">
        <span className="stat-value-container">
          <span className={`stat-value-flip-wrapper ${isAnimating ? 'flip-animation' : ''}`} key={flipKey}>
            <span className="stat-value-old">
              {unit && <span className="stat-unit">{unit}</span>}
              {prevValue}
              {suffix && <span className="stat-suffix">{suffix}</span>}
            </span>
            <span className="stat-value-new">
              {unit && <span className="stat-unit">{unit}</span>}
              {displayValue}
              {suffix && <span className="stat-suffix">{suffix}</span>}
            </span>
          </span>
        </span>
        {trend && trend !== 'stable' && (
          <span
            key={trendBounceKey}
            className={`stat-trend trend-bounce-${trend}`}
            style={{ color: trendColor }}
          >
            {trendIcon} {trendValue}
          </span>
        )}
        {trend && trend === 'stable' && (
          <span
            className="stat-trend"
            style={{ color: trendColor }}
          >
            {trendIcon} {trendValue}
          </span>
        )}
      </div>
      <div className="stat-sparkline">
        <svg width="60" height="20" viewBox="0 0 60 20">
          <path
            d={generateSparkline(valueDirection === 'stable' ? trend : valueDirection)}
            fill="none"
            stroke={trendColor}
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
};

function generateSparkline(trend?: string): string {
  const points: string[] = [];
  let y = 10;

  for (let x = 0; x <= 60; x += 5) {
    if (trend === 'up') {
      y = Math.max(2, 18 - x * 0.25 + (Math.random() - 0.5) * 3);
    } else if (trend === 'down') {
      y = Math.min(18, 2 + x * 0.25 + (Math.random() - 0.5) * 3);
    } else {
      y = 10 + (Math.random() - 0.5) * 6;
    }
    points.push(`${x},${y.toFixed(1)}`);
  }

  return `M${points.join(' L')}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip tooltip-animate-in">
        <div className="tooltip-label">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="tooltip-item">
            <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
            <span className="tooltip-name">{entry.name}</span>
            <span className="tooltip-value">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface OverviewTabProps {
  stats: ReturnType<typeof useSimulationStore.getState>['stats'];
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats }) => {
  return (
    <div className="tab-content overview-tab">
      <StatCard
        label="在港船舶"
        value={stats.shipsInPort}
        unit=""
        suffix="艘"
        trend="up"
        trendValue="+2"
      />
      <StatCard
        label="已用泊位"
        value={`${stats.usedBerthes}/${stats.totalBerthes}`}
        trend="stable"
        trendValue="0"
      />
      <StatCard
        label="堆场占用率"
        value={stats.yardOccupancy}
        suffix="%"
        trend="up"
        trendValue="5%"
      />
      <StatCard
        label="平均装船时间"
        value={stats.avgLoadingTime}
        suffix="分钟"
        trend="down"
        trendValue="-3min"
      />
      <StatCard
        label="已装集装箱"
        value={stats.totalContainersLoaded}
        suffix="箱"
        trend="up"
        trendValue="+12"
      />
      <StatCard
        label="装船效率"
        value={stats.loadingEfficiency}
        suffix="%"
        trend="up"
        trendValue="+8%"
      />
    </div>
  );
};

interface EfficiencyTabProps {
  efficiencies: BerthEfficiency[];
}

const EfficiencyTab: React.FC<EfficiencyTabProps> = ({ efficiencies }) => {
  const chartData = efficiencies.map((e) => ({
    name: e.berthName,
    作业时长: Math.floor(e.workDuration / 60),
    吊装次数: e.liftCount,
  }));

  return (
    <div className="tab-content efficiency-tab">
      <div className="chart-container">
        <h4 className="chart-title">各泊位作业效率对比</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barGap={8}>
            <defs>
              <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a73e8" stopOpacity={1} />
                <stop offset="100%" stopColor="#0d47a1" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorLift" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2ecc71" stopOpacity={1} />
                <stop offset="100%" stopColor="#27ae60" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#95a5a6', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              tick={{ fill: '#95a5a6', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar 
              dataKey="作业时长" 
              radius={[4, 4, 0, 0]} 
              fill="url(#colorDuration)"
            />
            <Bar 
              dataKey="吊装次数" 
              radius={[4, 4, 0, 0]} 
              fill="url(#colorLift)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface HistoryTabProps {
  simulationTime: number;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ simulationTime }) => {
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [startHour, setStartHour] = useState(0);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [endMinute, setEndMinute] = useState(59);

  const speeds = [1, 2, 4];

  useEffect(() => {
    if (!isPlaying || simulationTime === 0) return;

    const interval = setInterval(() => {
      setPlaybackTime((prev) => {
        const next = prev + 100 * playbackSpeed;
        if (next >= simulationTime) {
          setIsPlaying(false);
          return simulationTime;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, simulationTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeInput = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':').map(Number);
    setStartHour(h);
    setStartMinute(m);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':').map(Number);
    setEndHour(h);
    setEndMinute(m);
  };

  const applyTimeRange = () => {
    const startMs = (startHour * 3600 + startMinute * 60) * 1000;
    const endMs = (endHour * 3600 + endMinute * 60) * 1000;
    if (startMs < endMs && endMs <= simulationTime) {
      setPlaybackTime(startMs);
    }
  };

  const progress = simulationTime > 0 ? (playbackTime / simulationTime) * 100 : 0;

  return (
    <div className="tab-content history-tab">
      <div className="history-controls">
        <div className="time-range-selector">
          <div className="time-range-label">时间段选择:</div>
          <div className="time-range-inputs">
            <div className="time-input-group">
              <label>开始:</label>
              <input
                type="time"
                value={formatTimeInput(startHour, startMinute)}
                onChange={handleStartTimeChange}
                className="time-input"
              />
            </div>
            <span className="time-range-separator">至</span>
            <div className="time-input-group">
              <label>结束:</label>
              <input
                type="time"
                value={formatTimeInput(endHour, endMinute)}
                onChange={handleEndTimeChange}
                className="time-input"
              />
            </div>
            <button className="apply-time-btn" onClick={applyTimeRange}>
              应用
            </button>
          </div>
        </div>

        <div className="playback-time">
          <span className="time-label">回放时间:</span>
          <span className="time-value">{formatTime(playbackTime)}</span>
          <span className="time-separator">/</span>
          <span className="time-total">{formatTime(simulationTime)}</span>
        </div>

        <div className="playback-progress">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="progress-thumb"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <div className="playback-actions">
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>

          <div className="speed-pill-group">
            {speeds.map((speed) => (
              <button
                key={speed}
                className={`speed-pill ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mini-terminal">
        <div className="mini-sea">
          <div className="mini-waves">
            {[...Array(2)].map((_, i) => (
              <div key={i} className={`mini-wave wave-${i + 1}`} />
            ))}
          </div>
        </div>
        <div className="mini-berth-area">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`mini-berth type-${i <= 2 ? 'deep' : i <= 4 ? 'shallow' : 'maintenance'}`}>
              {i <= Math.floor(progress / 20) + 1 && (
                <div className="mini-ship">
                  <svg width="40" height="15" viewBox="0 0 40 15">
                    <path d="M3,7.5 Q20,2.5 37,7.5 L34,13 L6,13 Z" fill="#3498db" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mini-yard">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`mini-yard-slot ${i < Math.floor(progress / 7) ? 'filled' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const {
    stats,
    berthEfficiencies,
    activeDashboardTab,
    setActiveDashboardTab,
    simulationTime,
    suggestion,
  } = useSimulationStore();

  const tabs: { key: DashboardTab; label: string; icon: string }[] = [
    { key: 'overview', label: '作业概览', icon: '📊' },
    { key: 'efficiency', label: '效率分析', icon: '📈' },
    { key: 'history', label: '历史回放', icon: '🎬' },
  ];

  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      className={`dashboard ${className || ''} ${isMobile && !isExpanded ? 'collapsed' : ''}`}
    >
      {isMobile && (
        <button className="dashboard-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '▼ 收起数据面板' : '▲ 展开数据面板'}
        </button>
      )}

      {(!isMobile || isExpanded) && (
        <>
          <div className="dashboard-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab-btn ${activeDashboardTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveDashboardTab(tab.key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="dashboard-content">
            {activeDashboardTab === 'overview' && <OverviewTab stats={stats} />}
            {activeDashboardTab === 'efficiency' && (
              <EfficiencyTab efficiencies={berthEfficiencies} />
            )}
            {activeDashboardTab === 'history' && (
              <HistoryTab simulationTime={simulationTime} />
            )}
          </div>

          {suggestion && (
            <div className="dashboard-suggestion">
              💡 {suggestion}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
