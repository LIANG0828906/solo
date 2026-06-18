import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WeeklyStats, Category, CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/types';

interface StatisticsProps {
  stats: WeeklyStats;
}

export default function Statistics({ stats }: StatisticsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const pieData = useMemo(() => {
    return Object.values(Category)
      .map((cat) => ({
        name: CATEGORY_LABELS[cat],
        value: Math.round(stats.categoryTotals[cat] / 60 * 10) / 10,
        category: cat,
      }))
      .filter((d) => d.value > 0);
  }, [stats]);

  const totalHours = useMemo(() => {
    return Object.values(stats.categoryTotals).reduce((sum, val) => sum + val, 0) / 60;
  }, [stats]);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <motion.div
      className="h-full flex flex-col lg:flex-row gap-6 p-6 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex-1 glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">过去7天时间分布</h3>
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-[#6C63FF] font-mono">{totalHours.toFixed(1)}</span>
          <span className="text-gray-400 ml-2">总小时</span>
        </div>
        <div className="h-[300px]">
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
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationDuration={400}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.category]}
                    style={{
                      filter: `brightness(${activeIndex === index ? 1.2 : 1})`,
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} 小时`, '时长']}
                contentStyle={{
                  backgroundColor: '#1E1E3F',
                  border: '1px solid #3A3A5C',
                  borderRadius: '8px',
                  color: '#D0D0E0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {pieData.map((entry, index) => (
            <div
              key={entry.category}
              className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${
                activeIndex === index ? 'bg-white/10' : ''
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[entry.category] }}
              />
              <span className="text-sm text-gray-300">{entry.name}</span>
              <span className="text-sm text-white font-medium">{entry.value}h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">每日时间分配</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3A5C" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#8888A0', fontSize: 12 }}
                axisLine={{ stroke: '#3A3A5C' }}
              />
              <YAxis
                tick={{ fill: '#8888A0', fontSize: 12 }}
                axisLine={{ stroke: '#3A3A5C' }}
                tickFormatter={(value) => `${value / 60}h`}
              />
              <Tooltip
                formatter={(value: number) => [`${Math.round(value / 60 * 10) / 10} 小时`, '']}
                contentStyle={{
                  backgroundColor: '#1E1E3F',
                  border: '1px solid #3A3A5C',
                  borderRadius: '8px',
                  color: '#D0D0E0',
                }}
              />
              {Object.values(Category).map((cat) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="a"
                  fill={CATEGORY_COLORS[cat]}
                  name={CATEGORY_LABELS[cat]}
                  animationDuration={400}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
