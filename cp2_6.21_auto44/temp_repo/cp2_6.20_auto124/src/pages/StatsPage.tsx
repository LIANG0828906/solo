import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useStore';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const TYPE_COLORS: Record<string, string> = {
  strength: '#e74c3c',
  cardio: '#3498db',
  yoga: '#2ecc71',
  other: '#9b59b6',
};

export default function StatsPage() {
  const { monthStats, fetchMonthStats, loading } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchMonthStats(currentMonth);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [currentMonth, fetchMonthStats]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => dayjs(prev + '-01').subtract(1, 'month').format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => dayjs(prev + '-01').add(1, 'month').format('YYYY-MM'));
  };

  const barData = monthStats?.dailyStats.map((stat) => ({
    date: dayjs(stat.date).format('MM-DD'),
    时长: stat.duration,
  })) || [];

  const pieData = monthStats?.typeStats.map((stat) => ({
    name: stat.typeName,
    value: stat.duration,
    type: stat.type,
  })) || [];

  return (
    <div
      className={`min-h-screen bg-[#1a1d24] text-white transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">统计仪表盘</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2 rounded-lg bg-[#2a2d35] hover:bg-[#3a3d45] transition-colors"
            >
              上一月
            </button>
            <span className="text-lg font-medium min-w-[120px] text-center">
              {dayjs(currentMonth + '-01').format('YYYY年M月')}
            </span>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 rounded-lg bg-[#2a2d35] hover:bg-[#3a3d45] transition-colors"
            >
              下一月
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="p-6"
            style={{ backgroundColor: '#2a2d35', borderRadius: '12px' }}
          >
            <p className="text-gray-400 text-sm mb-1">月度总时长</p>
            <p className="text-3xl font-bold text-[#ff6b35]">
              {monthStats?.totalDuration || 0} <span className="text-lg font-normal">分钟</span>
            </p>
          </div>
          <div
            className="p-6"
            style={{ backgroundColor: '#2a2d35', borderRadius: '12px' }}
          >
            <p className="text-gray-400 text-sm mb-1">总训练次数</p>
            <p className="text-3xl font-bold text-[#ff6b35]">
              {monthStats?.totalRecords || 0} <span className="text-lg font-normal">次</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div
            className="flex-1 p-6"
            style={{ backgroundColor: '#2a2d35', borderRadius: '12px' }}
          >
            <h2 className="text-xl font-semibold mb-4">月度训练时长</h2>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  加载中...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis
                      dataKey="date"
                      stroke="#666"
                      tick={{ fill: '#999', fontSize: 12 }}
                      axisLine={{ stroke: '#444' }}
                    />
                    <YAxis
                      stroke="#666"
                      tick={{ fill: '#999', fontSize: 12 }}
                      axisLine={{ stroke: '#444' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#23262e',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value} 分钟`, '时长']}
                    />
                    <Bar
                      dataKey="时长"
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff6b35" />
                        <stop offset="100%" stopColor="#ff8c5a" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div
            className="flex-1 p-6"
            style={{ backgroundColor: '#2a2d35', borderRadius: '12px' }}
          >
            <h2 className="text-xl font-semibold mb-4">训练类型分布</h2>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  加载中...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={TYPE_COLORS[entry.type] || '#9b59b6'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#23262e',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value} 分钟`, '时长']}
                    />
                    <Legend
                      formatter={(value: string) => (
                        <span style={{ color: '#ccc' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
