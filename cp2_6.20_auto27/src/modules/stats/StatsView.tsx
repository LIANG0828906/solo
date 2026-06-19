import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Flame, TrendingUp, Clock, Award, Calendar } from 'lucide-react';
import { statsApi } from '../../services/api';
import type { StatsData, WeekdayHeatmapData, HabitHeatmapData } from '../habits/types';

type HeatmapMode = 'weekday' | 'habit';
type TimeRange = 7 | 30 | 90;

const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 7, label: '近7天' },
  { value: 30, label: '近30天' },
  { value: 90, label: '近90天' },
];

interface HoveredCell {
  hour: number;
  xIndex: number;
  completionRate: number;
  count: number;
  xLabel: string;
}

export default function StatsView() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('weekday');
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await statsApi.getStats(timeRange);
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: HeatmapMode) => {
    if (mode === heatmapMode) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setHeatmapMode(mode);
      setIsTransitioning(false);
    }, 200);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    if (range === timeRange) return;
    setTimeRange(range);
  };

  const chartData = useMemo(() => {
    return stats?.completionRateByDay.map(item => ({
      ...item,
      displayDate: format(new Date(item.date), timeRange === 7 ? 'MM/dd' : 'M/d', { locale: zhCN }),
      percentage: Math.round(item.rate * 100),
    })) || [];
  }, [stats, timeRange]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const xAxisLabels = useMemo(() => {
    if (heatmapMode === 'weekday') {
      return weekdayLabels;
    }
    return stats?.habits.map(h => h.name) || [];
  }, [heatmapMode, stats]);

  const getHeatmapData = (hour: number, xIndex: number): { completionRate: number; count: number } => {
    if (!stats) return { completionRate: 0, count: 0 };

    if (heatmapMode === 'weekday') {
      const weekday = weekdayOrder[xIndex];
      const found = stats.heatmapData.find(
        (d: WeekdayHeatmapData) => d.hour === hour && d.weekday === weekday
      );
      return {
        completionRate: found?.completionRate || 0,
        count: found?.count || 0,
      };
    } else {
      const habit = stats.habits[xIndex];
      if (!habit) return { completionRate: 0, count: 0 };
      const found = stats.habitHeatmapData.find(
        (d: HabitHeatmapData) => d.hour === hour && d.habitId === habit.id
      );
      return {
        completionRate: found?.completionRate || 0,
        count: found?.count || 0,
      };
    }
  };

  const getHeatmapColor = (completionRate: number) => {
    if (completionRate === 0) return 'rgba(255, 255, 255, 0.05)';
    const r = Math.round(255 * (1 - completionRate));
    const g = Math.round(200 * completionRate);
    const b = Math.round(100 * (1 - completionRate));
    return `rgba(${r}, ${g}, ${b}, ${0.3 + completionRate * 0.6})`;
  };

  const getXLabel = (xIndex: number): string => {
    return xAxisLabels[xIndex] || '';
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { displayDate: string; percentage: number } }[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-dark border border-white/10 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-sm text-text-secondary">{payload[0].payload.displayDate}</p>
          <p className="text-lg font-bold text-text-primary">{payload[0].payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const avgCompletionRate = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((acc, d) => acc + d.percentage, 0) / chartData.length);
  }, [chartData]);

  const totalCount = useMemo(() => {
    if (!stats) return 0;
    const data = heatmapMode === 'weekday' ? stats.heatmapData : stats.habitHeatmapData;
    return data.reduce((acc: number, d: { count: number }) => acc + d.count, 0);
  }, [stats, heatmapMode]);

  const chartInterval = useMemo(() => {
    if (timeRange === 7) return 0;
    if (timeRange === 30) return 4;
    return 12;
  }, [timeRange]);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-6">统计分析</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-card rounded-xl p-4 backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-success" />
            </div>
            <div>
              <p className="text-text-muted text-xs">平均完成率</p>
              <p className="text-xl font-bold text-text-primary">
                {loading ? '--' : `${avgCompletionRate}%`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-bg-card rounded-xl p-4 backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Clock size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-text-muted text-xs">总完成次数</p>
              <p className="text-xl font-bold text-text-primary">
                {loading ? '--' : totalCount}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-bg-card rounded-xl p-4 backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Flame size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-text-muted text-xs">最长连续天数</p>
              <p className="text-xl font-bold text-text-primary">
                {loading ? '--' : `${stats?.streakRanking[0]?.streak || 0} 天`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-bg-card rounded-xl p-4 backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center">
              <Award size={20} className="text-danger" />
            </div>
            <div>
              <p className="text-text-muted text-xs">习惯总数</p>
              <p className="text-xl font-bold text-text-primary">
                {loading ? '--' : stats?.habits.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-text-primary">完成率趋势</h2>
            
            <div className="flex items-center gap-1 bg-bg-dark/50 rounded-lg p-1">
              {timeRangeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleTimeRangeChange(option.value)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ease-out
                    ${timeRange === option.value
                      ? 'bg-accent text-white shadow-md'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a29bfe" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a29bfe" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tick={{ fill: 'rgba(255,255,255,0.5)' }}
                    interval={chartInterval}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tick={{ fill: 'rgba(255,255,255,0.5)' }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#a29bfe" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                    dot={false}
                    activeDot={{ r: 6, fill: '#a29bfe', stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-text-primary">习惯强度热力图</h2>
            
            <div className="flex items-center gap-1 bg-bg-dark/50 rounded-lg p-1">
              <button
                onClick={() => handleModeChange('weekday')}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ease-out
                  ${heatmapMode === 'weekday'
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }
                `}
              >
                按星期查看
              </button>
              <button
                onClick={() => handleModeChange('habit')}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ease-out
                  ${heatmapMode === 'habit'
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }
                `}
              >
                按习惯查看
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <div className="relative">
              <div className="overflow-x-auto">
                <div 
                  className={`min-w-[400px] transition-all duration-300 ease-out ${
                    isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <div className="flex mb-2">
                    <div className="w-12 flex-shrink-0" />
                    {xAxisLabels.map((label, index) => (
                      <div 
                        key={`label-${index}`}
                        className="flex-1 text-center text-xs text-text-muted min-w-0 overflow-hidden text-ellipsis px-1"
                        style={{ minWidth: heatmapMode === 'habit' ? '80px' : 'auto' }}
                        title={label}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  
                  {hours.map(hour => (
                    <div key={`row-${hour}`} className="flex items-center gap-1 mb-1">
                      <div className="w-12 flex-shrink-0 text-xs text-text-muted">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      {xAxisLabels.map((_, xIndex) => {
                        const { completionRate, count } = getHeatmapData(hour, xIndex);
                        return (
                          <button
                            key={`cell-${hour}-${xIndex}`}
                            className={`
                              flex-1 aspect-square rounded-md relative
                              transition-all duration-300 ease-out
                              hover:scale-110 hover:z-10 hover:shadow-lg
                            `}
                            style={{ 
                              backgroundColor: getHeatmapColor(completionRate),
                              minWidth: heatmapMode === 'habit' ? '80px' : 'auto',
                              transform: isTransitioning ? 'scale(0.9)' : 'scale(1)',
                              opacity: isTransitioning ? 0 : 1,
                              transitionDelay: `${(hour * 10) + (xIndex * 5)}ms`,
                            }}
                            onMouseEnter={() => setHoveredCell({ 
                              hour, 
                              xIndex, 
                              completionRate, 
                              count,
                              xLabel: getXLabel(xIndex),
                            })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {hoveredCell?.hour === hour && hoveredCell?.xIndex === xIndex && (
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-bg-dark border border-white/20 px-3 py-2 rounded-lg text-xs text-text-primary whitespace-nowrap z-30 shadow-xl animate-fade-in">
                                <div className="font-medium">{hoveredCell.xLabel} · {String(hour).padStart(2, '0')}:00</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-text-secondary">完成率:</span>
                                  <span className={`font-bold ${
                                    completionRate >= 0.7 ? 'text-success' :
                                    completionRate >= 0.4 ? 'text-warning' : 'text-danger'
                                  }`}>
                                    {Math.round(completionRate * 100)}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-text-secondary">次数:</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-4">
                <span className="text-xs text-text-muted">低</span>
                <div className="flex gap-0.5">
                  {[0.1, 0.3, 0.5, 0.7, 1].map((intensity, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm transition-all duration-300"
                      style={{ backgroundColor: getHeatmapColor(intensity) }}
                    />
                  ))}
                </div>
                <span className="text-xs text-text-muted">高</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-white/5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">连续天数排名</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.streakRanking.map((item, index) => (
                <div
                  key={item.habitId}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-500 text-yellow-900' : 
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-amber-100' :
                      'bg-white/10 text-text-muted'}
                  `}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{item.habitName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Flame size={12} className="text-warning" />
                      <span className="text-xs text-text-secondary">连续 {item.streak} 天</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(item.streak / Math.max(stats.streakRanking[0]?.streak || 1, 1)) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary w-12 text-right">
                      {item.streak}天
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
