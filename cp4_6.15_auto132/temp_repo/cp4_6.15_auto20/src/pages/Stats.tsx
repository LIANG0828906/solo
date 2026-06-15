import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getStats, StatsData } from '@/data';
import { PawPrint, TrendingUp, CalendarPlus, Award } from 'lucide-react';

interface StatsProps {
  onBack: () => void;
}

const CHART_COLORS = ['#5A8F6E', '#7BAE8C', '#A8D5BA', '#C8E6D4', '#E8F5EC'];

const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  if (!stats) return null;

  const statCards = [
    {
      label: '待领养宠物',
      value: stats.totalAvailable,
      icon: PawPrint,
      color: 'from-green-400 to-green-600',
    },
    {
      label: '本月新增',
      value: stats.monthlyNew,
      icon: CalendarPlus,
      color: 'from-blue-400 to-blue-600',
    },
    {
      label: '本月领养成功',
      value: stats.monthlyAdopted,
      icon: TrendingUp,
      color: 'from-emerald-400 to-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F3] via-white to-[#F0F9F2]">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors"
          >
            ← 返回
          </button>
          <h1
            className="text-xl font-bold text-gray-800"
            style={{ fontFamily: "'Merriweather', serif" }}
          >
            数据统计看板
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl p-6 bg-white shadow-sm
                border border-green-50 hover:shadow-md transition-shadow"
            >
              <div
                className={`absolute -right-4 -top-4 w-24 h-24 rounded-full
                  bg-gradient-to-br ${card.color} opacity-10`}
              />
              <div className="relative">
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.color} text-white mb-3`}
                >
                  <card.icon size={22} />
                </div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p
                  className="text-3xl font-bold text-gray-800"
                  style={{ fontFamily: "'Merriweather', serif" }}
                >
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-6 border border-green-50"
            style={{
              background:
                'linear-gradient(135deg, rgba(168,213,186,0.15) 0%, rgba(253,248,243,0.8) 100%)',
              boxShadow: '0 4px 12px rgba(90,143,110,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Award size={20} className="text-green-600" />
              <h3 className="text-lg font-bold text-gray-800">最受欢迎品种 TOP5</h3>
            </div>
            <div className="h-64">
              {stats.topBreeds.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topBreeds} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis
                      type="category"
                      dataKey="breed"
                      tick={{ fontSize: 12, fill: '#374151' }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value: number) => [`${value} 只`, '数量']}
                    />
                    <Bar
                      dataKey="count"
                      fill="#5A8F6E"
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                    >
                      {stats.topBreeds.map((_, index) => (
                        <rect
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          <div
            className="rounded-2xl p-6 border border-green-50"
            style={{
              background:
                'linear-gradient(135deg, rgba(168,213,186,0.15) 0%, rgba(253,248,243,0.8) 100%)',
              boxShadow: '0 4px 12px rgba(90,143,110,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={20} className="text-green-600" />
              <h3 className="text-lg font-bold text-gray-800">近6个月领养趋势</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyTrend} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`${value} 例`, '领养成功']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#5A8F6E"
                    strokeWidth={3}
                    dot={{ fill: '#5A8F6E', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#7BAE8C', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
