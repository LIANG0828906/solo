import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue && typeof value === 'number') {
      setIsAnimating(true);
      const startValue = typeof displayValue === 'number' ? displayValue : 0;
      const diff = value - startValue;
      const duration = 500;
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
    }
  }, [value]);

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? '#2ecc71' : trend === 'down' ? '#e74c3c' : '#95a5a6';

  return (
    <div className={`stat-card ${isAnimating ? 'animating' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value-row">
        <span className="stat-value">
          {unit && <span className="stat-unit">{unit}</span>}
          {displayValue}
          {suffix && <span className="stat-suffix">{suffix}</span>}
        </span>
        {trend && (
          <span className="stat-trend" style={{ color: trendColor }}>
            {trendIcon} {trendValue}
          </span>
        )}
      </div>
      <div className="stat-sparkline">
        <svg width="60" height="20" viewBox="0 0 60 20">
          <path
            d={generateSparkline(trend)}
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
      <div className="custom-tooltip">
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
                <stop offset="0%" stopColor="#1a73e8" />
                <stop offset="100%" stopColor="#0d47a1" />
              </linearGradient>
              <linearGradient id="colorLift" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2ecc71" />
                <stop offset="100%" stopColor="#27ae60" />
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
            <Bar dataKey="作业时长" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-duration-${index}`} fill="url(#colorDuration)" />
              ))}
            </Bar>
            <Bar dataKey="吊装次数" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-lift-${index}`} fill="url(#colorLift)" />
              ))}
            </Bar>
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

  const progress = simulationTime > 0 ? (playbackTime / simulationTime) * 100 : 0;

  return (
    <div className="tab-content history-tab">
      <div className="history-controls">
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

          <div className="speed-buttons">
            {speeds.map((speed) => (
              <button
                key={speed}
                className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
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
