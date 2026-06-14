import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Skeleton from '@/components/Skeleton';
import { cn } from '@/lib/utils';

const CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '其他'];

const COLORS = [
  '#3EB489',
  '#1E3A5F',
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#FF9F45',
];

interface CategoryData {
  category: string;
  current: number;
  previous: number;
  color: string;
}

const generateMonthlyData = (year: number, month: number): CategoryData[] => {
  return CATEGORIES.map((cat, idx) => ({
    category: cat,
    current: Math.round((Math.random() * 3000 + 500) * 100) / 100,
    previous: Math.round((Math.random() * 3000 + 500) * 100) / 100,
    color: COLORS[idx % COLORS.length],
  }));
};

const formatMonth = (date: Date) => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-navy-500 px-4 py-3 rounded-xl shadow-xl border border-gray-200 dark:border-navy-400/30">
        <p className="font-medium text-navy-500 dark:text-white">{data.name}</p>
        <p className="text-mint-600 dark:text-mint-300 font-bold">
          ¥{data.value.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
          占比 {data.payload.percent}%
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-navy-500 px-4 py-3 rounded-xl shadow-xl border border-gray-200 dark:border-navy-400/30">
        <p className="font-medium text-navy-500 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p
            key={idx}
            className="text-sm flex items-center gap-2"
            style={{ color: entry.color }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: ¥{entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StatisticsPanel() {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CategoryData[]>([]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setData(generateMonthlyData(currentDate.getFullYear(), currentDate.getMonth()));
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    const now = new Date();
    if (
      currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() === now.getMonth()
    ) {
      return;
    }
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const pieData = data.map((d) => ({
    name: d.category,
    value: d.current,
    color: d.color,
    percent: ((d.current / data.reduce((s, x) => s + x.current, 0)) * 100).toFixed(1),
  }));

  const totalCurrent = data.reduce((s, d) => s + d.current, 0);
  const totalPrevious = data.reduce((s, d) => s + d.previous, 0);
  const diff = totalCurrent - totalPrevious;
  const diffPercent = totalPrevious > 0 ? ((diff / totalPrevious) * 100).toFixed(1) : '0';

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-navy-500 dark:to-navy-600">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-navy-500 dark:text-white">月度统计</h1>

          <div className="flex items-center gap-2 bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-xl px-3 py-2 shadow-lg border border-white/50 dark:border-navy-400/20">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-400/30 text-navy-500 dark:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-semibold text-navy-500 dark:text-white min-w-[120px] text-center">
              {formatMonth(currentDate)}
            </span>
            <button
              onClick={goToNextMonth}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentDate.getFullYear() === new Date().getFullYear() &&
                currentDate.getMonth() === new Date().getMonth()
                  ? 'text-gray-300 dark:text-gray-500 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-navy-400/30 text-navy-500 dark:text-white'
              )}
              disabled={
                currentDate.getFullYear() === new Date().getFullYear() &&
                currentDate.getMonth() === new Date().getMonth()
              }
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-80" />
            </div>
            <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-80" />
            </div>
            <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 lg:col-span-2">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 hover:scale-[1.02] transition-transform duration-300">
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">本月总支出</p>
                <p className="text-3xl font-bold text-navy-500 dark:text-white">
                  ¥{totalCurrent.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 hover:scale-[1.02] transition-transform duration-300">
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">上月总支出</p>
                <p className="text-3xl font-bold text-navy-500 dark:text-white">
                  ¥{totalPrevious.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 hover:scale-[1.02] transition-transform duration-300">
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">环比变化</p>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    diff < 0 ? 'text-mint-600 dark:text-mint-300' : 'text-red-500'
                  )}
                >
                  {diff >= 0 ? '+' : ''}
                  {diffPercent}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  {diff >= 0 ? '增加' : '减少'} ¥{Math.abs(diff).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 animate-fade-in">
                <h2 className="text-lg font-semibold text-navy-500 dark:text-white mb-4">
                  支出分类占比
                </h2>
                <div className="h-80">
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
                        animationBegin={0}
                        animationDuration={1200}
                        animationEasing="ease-out"
                        label={({ name, percent }: any) => `${name} ${percent}%`}
                        labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                        onMouseEnter={(_, index) => {
                          const pies = document.querySelectorAll<HTMLElement>('.recharts-pie-sector');
                          pies.forEach((p, i) => {
                            if (i === index) {
                              p.setAttribute('transform-origin', 'center');
                              p.style.transform = 'scale(1.1)';
                              p.style.transition = 'transform 0.3s ease';
                            }
                          });
                        }}
                        onMouseLeave={() => {
                          document.querySelectorAll<HTMLElement>('.recharts-pie-sector').forEach((p) => {
                            p.style.transform = 'scale(1)';
                          });
                        }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="none"
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-lg font-semibold text-navy-500 dark:text-white mb-4">
                  分类金额对比
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis
                        dataKey="category"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `¥${value}`}
                      />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(62, 180, 137, 0.05)' }} />
                      <Legend
                        wrapperStyle={{ paddingTop: 20 }}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="previous"
                        name="上月"
                        fill="#1E3A5F"
                        radius={[6, 6, 0, 0]}
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                      <Bar
                        dataKey="current"
                        name="本月"
                        fill="#3EB489"
                        radius={[6, 6, 0, 0]}
                        animationBegin={200}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-navy-400/20 lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-lg font-semibold text-navy-500 dark:text-white mb-4">
                  分类详情
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {data.map((item, idx) => (
                    <div
                      key={item.category}
                      className="p-4 rounded-xl bg-white/50 dark:bg-navy-500/30 border border-gray-100 dark:border-navy-400/20 hover:scale-105 transition-transform duration-300 cursor-pointer"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md"
                        style={{ backgroundColor: item.color + '20' }}
                      >
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                      <p className="text-sm font-medium text-navy-500 dark:text-white mb-1">
                        {item.category}
                      </p>
                      <p className="text-lg font-bold" style={{ color: item.color }}>
                        ¥{item.current.toFixed(0)}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          item.current >= item.previous
                            ? 'text-red-500'
                            : 'text-mint-600 dark:text-mint-300'
                        )}
                      >
                        {item.current >= item.previous ? '↑' : '↓'}{' '}
                        {Math.abs(((item.current - item.previous) / item.previous) * 100).toFixed(
                          1
                        )}
                        %
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
