import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Flame, TrendingUp, Clock, Award } from 'lucide-react';
import { statsApi } from '../../services/api';
import type { StatsData } from '../habits/types';

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function StatsView() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ hour: number; weekday: number; count: number } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await statsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = stats?.completionRateByDay.map(item => ({
    ...item,
    displayDate: format(new Date(item.date), 'M/d', { locale: zhCN }),
    percentage: Math.round(item.rate * 100),
  })) || [];

  const getHeatmapColor = (count: number) => {
    const maxCount = 10;
    const intensity = Math.min(count / maxCount, 1);
    if (intensity === 0) return 'rgba(255, 255, 255, 0.05)';
    if (intensity < 0.3) return 'rgba(162, 155, 254, 0.2)';
    if (intensity < 0.6) return 'rgba(162, 155, 254, 0.5)';
    if (intensity < 0.8) return 'rgba(162, 155, 254, 0.7)';
    return 'rgba(162, 155, 254, 1)';
  };

  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  const weekdays = [0, 1, 2, 3, 4, 5, 6];

  const getHeatmapCount = (hour: number, weekday: number): number => {
    if (!stats) return 0;
    const found = stats.heatmapData.find(d => d.hour === hour && d.weekday === weekday);
    return found?.count || 0;
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

  const completionColor = (percentage: number) => {
    if (percentage >= 70) return '#00d26a';
    if (percentage >= 40) return '#ffd93d';
    return '#ff6b6b';
  };

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
              <p className="text-text-muted text-xs">月平均完成率</p>
              <p className="text-xl font-bold text-text-primary">
                {loading ? '--' : `${Math.round((chartData.reduce((acc, d) => acc + d.percentage, 0) / Math.max(chartData.length, 1)))}%`}
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
                {loading ? '--' : stats?.heatmapData.reduce((acc, d) => acc + d.count, 0) || 0}
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
                {loading ? '--' : stats?.streakRanking[0]?.streak || 0} 天
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
                {loading ? '--' : stats?.streakRanking.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-white/5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">近30天完成率</h2>
          
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
                    interval={4}
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
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-bg-card rounded-2xl p-5 backdrop-blur-sm border border-white/5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">习惯强度热力图</h2>
          
          {loading ? (
            <div className="h-64 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <div className="relative">
              <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                  <div className="flex mb-2">
                    <div className="w-12" />
                    {weekdays.map(day => (
                      <div key={day} className="flex-1 text-center text-xs text-text-muted">
                        {weekdayLabels[day]}
                      </div>
                    ))}
                  </div>
                  
                  {hours.map(hour => (
                    <div key={hour} className="flex items-center gap-1 mb-1">
                      <div className="w-12 text-xs text-text-muted">{hour}:00</div>
                      {weekdays.map(weekday => {
                        const count = getHeatmapCount(hour, weekday);
                        return (
                          <button
                            key={`${hour}-${weekday}`}
                            className="flex-1 aspect-square rounded-md transition-all duration-200 ease-out hover:scale-110 hover:z-10 relative"
                            style={{ backgroundColor: getHeatmapColor(count) }}
                            onMouseEnter={() => setHoveredCell({ hour, weekday, count })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {hoveredCell?.hour === hour && hoveredCell?.weekday === weekday && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-dark border border-white/20 px-2 py-1 rounded text-xs text-text-primary whitespace-nowrap z-20 shadow-lg">
                                {hour}:00 - {weekdayLabels[weekday]}: {count}次
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
                <span className="text-xs text-text-muted">少</span>
                <div className="flex gap-0.5">
                  {[0.1, 0.3, 0.5, 0.7, 1].map((intensity, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: `rgba(162, 155, 254, ${intensity})` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-text-muted">多</span>
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
