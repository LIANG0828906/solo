import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, MessageCircle, Heart, Repeat2 } from 'lucide-react';
import { useContentStore } from './store';
import { Platform, PLATFORM_CONFIG } from './types';

const COLORS = ['#00e5ff', '#ff6b6b', '#a855f7'];

interface CustomPieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { platform: Platform; count: number };
  }>;
}

const CustomPieTooltip: React.FC<CustomPieTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const config = PLATFORM_CONFIG[data.platform];
    const total = payload.reduce((sum, p) => sum + p.value, 0);
    const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : '0';

    return (
      <div className="chart-tooltip glass-panel">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          ></div>
          <span className="text-white font-medium">{config.name}</span>
        </div>
        <div className="text-gray-400 text-sm">
          发帖数: <span className="text-white font-mono">{data.count}</span>
        </div>
        <div className="text-gray-400 text-sm">
          占比: <span className="text-cyan-400 font-mono">{percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

interface CustomLineTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomLineTooltip: React.FC<CustomLineTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip glass-panel">
        <div className="text-white font-medium mb-2">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-gray-400">
              {entry.dataKey === 'postCount' ? '发帖数' : '互动量'}:
            </span>
            <span className="text-white font-mono">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}> = ({ title, value, icon, trend, color }) => {
  return (
    <div className="stat-card glass-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const getYesterdayPostCount = useContentStore((state) => state.getYesterdayPostCount);
  const getWeeklyEngagement = useContentStore((state) => state.getWeeklyEngagement);
  const getPlatformStats = useContentStore((state) => state.getPlatformStats);
  const getWeeklyStats = useContentStore((state) => state.getWeeklyStats);
  const contents = useContentStore((state) => state.contents);

  const platformStats = useMemo(() => getPlatformStats(), [contents]);
  const weeklyStats = useMemo(() => getWeeklyStats(), [contents]);
  const yesterdayCount = useMemo(() => getYesterdayPostCount(), [contents]);
  const weeklyEngagement = useMemo(() => getWeeklyEngagement(), [contents]);

  const totalPublished = platformStats.reduce((sum, p) => sum + p.count, 0);

  const pieData = platformStats.map((stat) => ({
    platform: stat.platform,
    count: stat.count,
    name: PLATFORM_CONFIG[stat.platform].name,
  }));

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="dashboard-container">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          数据概览
        </h2>
        <span className="text-xs text-gray-500">数据每日自动更新</span>
      </div>

      <div className="stats-grid mb-6">
        <StatCard
          title="昨日发帖"
          value={yesterdayCount}
          icon={<BarChart3 size={20} />}
          trend="+12% vs 前日"
          color="#00e5ff"
        />
        <StatCard
          title="本周互动"
          value={weeklyEngagement}
          icon={<Activity size={20} />}
          trend="+23% vs 上周"
          color="#ff6b6b"
        />
        <StatCard
          title="累计发布"
          value={totalPublished}
          icon={<PieChartIcon size={20} />}
          trend="持续增长"
          color="#a855f7"
        />
        <StatCard
          title="平台数"
          value={platformStats.filter((p) => p.count > 0).length}
          icon={<MessageCircle size={20} />}
          color="#22d3ee"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-card">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <PieChartIcon size={16} className="text-purple-400" />
            平台发布占比
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  animationDuration={800}
                  animationBegin={0}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                      style={{
                        transform: activeIndex === index ? 'scale(1.08)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: activeIndex === index ? 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.5))' : 'none',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            {pieData.map((item, index) => (
              <div key={item.platform} className="legend-item">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-gray-400 text-xs">{item.name}</span>
                <span className="text-white text-xs font-mono ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card glass-card">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" />
            近7天发帖趋势
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyStats}>
                <defs>
                  <linearGradient id="colorPostCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="postCount"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPostCount)"
                  animationDuration={1000}
                  dot={{
                    fill: '#00e5ff',
                    stroke: '#0a0a1a',
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#00e5ff',
                    strokeWidth: 2,
                    fill: '#0a0a1a',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEngagement)"
                  animationDuration={1000}
                  dot={{
                    fill: '#a855f7',
                    stroke: '#0a0a1a',
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#a855f7',
                    strokeWidth: 2,
                    fill: '#0a0a1a',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <span className="text-gray-400 text-xs">发帖数</span>
            </div>
            <div className="legend-item">
              <div className="w-3 h-3 rounded-full bg-purple-400"></div>
              <span className="text-gray-400 text-xs">互动量</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
