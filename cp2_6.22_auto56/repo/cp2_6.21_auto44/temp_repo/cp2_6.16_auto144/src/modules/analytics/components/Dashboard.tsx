import { useState } from 'react';
import { useReadingStore } from '@/modules/reading/store';
import type { TimeRange } from '@/types';
import { BarChartComponent, PieChartComponent, LineChartComponent } from './Charts';
import { aggregatePagesByPeriod, aggregateMoodDistribution, calculateStreakData } from '../utils';
import { TrendingUp, PieChart as PieIcon, Activity, Calendar, BookOpen, Clock, Target } from 'lucide-react';

export function Dashboard() {
  const { records, goals } = useReadingStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const pagesData = aggregatePagesByPeriod(records, timeRange);
  const moodData = aggregateMoodDistribution(records, timeRange);
  const streakData = calculateStreakData(records, timeRange);

  const totalPages = records.reduce((sum, r) => sum + (r.endPage - r.startPage + 1), 0);
  const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);
  const completedGoals = goals.filter((g) => g.currentPage >= g.totalPages).length;

  const getCurrentStreak = () => {
    const readingDates = new Set(
      records.map((r) => new Date(r.date).toISOString().split('T')[0])
    );
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (readingDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          阅读统计
        </h2>
        <div className="flex gap-2 bg-white rounded-lg border border-[#DCD6D0] p-1">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-250 ${
              timeRange === 'week'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={timeRange === 'week' ? { backgroundColor: '#8B4513' } : {}}
            onClick={() => setTimeRange('week')}
          >
            本周
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-250 ${
              timeRange === 'month'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={timeRange === 'month' ? { backgroundColor: '#8B4513' } : {}}
            onClick={() => setTimeRange('month')}
          >
            本月
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCD6D0] rounded-xl p-5 transition-all duration-250 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(139, 69, 19, 0.1)' }}>
              <BookOpen className="w-6 h-6" style={{ color: '#8B4513' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">总阅读页数</p>
              <p className="text-2xl font-bold text-gray-800">{totalPages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DCD6D0] rounded-xl p-5 transition-all duration-250 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(160, 82, 45, 0.1)' }}>
              <Clock className="w-6 h-6" style={{ color: '#A0522D' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">总阅读时长</p>
              <p className="text-2xl font-bold text-gray-800">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DCD6D0] rounded-xl p-5 transition-all duration-250 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
              <Target className="w-6 h-6" style={{ color: '#4CAF50' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">已完成目标</p>
              <p className="text-2xl font-bold text-gray-800">{completedGoals}/{goals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DCD6D0] rounded-xl p-5 transition-all duration-250 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
              <Activity className="w-6 h-6" style={{ color: '#FF9800' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">连续阅读</p>
              <p className="text-2xl font-bold text-gray-800">{getCurrentStreak()} 天</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#DCD6D0] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: '#8B4513' }} />
            <h3 className="text-lg font-semibold text-gray-800">阅读页数趋势</h3>
          </div>
          <BarChartComponent
            data={pagesData}
            timeRange={timeRange}
            chartKey="pages"
          />
        </div>

        <div className="bg-white border border-[#DCD6D0] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5" style={{ color: '#8B4513' }} />
            <h3 className="text-lg font-semibold text-gray-800">心情分布</h3>
          </div>
          <PieChartComponent data={moodData} timeRange={timeRange} />
        </div>
      </div>

      <div className="bg-white border border-[#DCD6D0] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" style={{ color: '#8B4513' }} />
          <h3 className="text-lg font-semibold text-gray-800">连续阅读天数</h3>
        </div>
        <LineChartComponent data={streakData} timeRange={timeRange} />
      </div>
    </div>
  );
}
