import { useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { useDeskStore } from '@/stores/deskStore';
import { getDailyWorkHours, getWeeklyAttendanceRate } from '@/utils/dateUtils';

function CustomBarLabel(props: { x?: number; y?: number; value?: number }) {
  const { x, y, value } = props;
  if (value === 0) return null;
  return (
    <text
      x={x}
      y={y}
      dx={-5}
      dy={-5}
      textAnchor="middle"
      fill="#666"
      fontSize={12}
      fontWeight={500}
    >
      {value?.toFixed(1)}
    </text>
  );
}

export default function StatsPage() {
  const { checkinRecords, currentUserId, initialized, initializeData } = useDeskStore();

  useEffect(() => {
    if (!initialized) {
      initializeData();
    }
  }, [initialized, initializeData]);

  const userRecords = useMemo(
    () => checkinRecords.filter((r) => r.userId === currentUserId),
    [checkinRecords, currentUserId]
  );

  const dailyHours = useMemo(
    () => getDailyWorkHours(userRecords),
    [userRecords]
  );

  const weeklyRates = useMemo(
    () => getWeeklyAttendanceRate(userRecords),
    [userRecords]
  );

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px] mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">工时统计</h1>
        <p className="text-gray-500 text-sm">查看你的工作时长和到工率</p>
      </div>

      <div
        className="bg-white rounded-lg p-6 mb-6 shadow-md"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">本周每日工时</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyHours} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                tick={{ fill: '#999', fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#999', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                unit="h"
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} 小时`, '工时']}
                contentStyle={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: 'none',
                }}
              />
              <Bar
                dataKey="hours"
                fill="#4CAF50"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                label={<CustomBarLabel />}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className="bg-white rounded-lg p-6 shadow-md"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">近4周到工率</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyRates} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="weekLabel"
                tick={{ fill: '#999', fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#999', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, '到工率']}
                contentStyle={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: 'none',
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#2196F3"
                strokeWidth={2}
                fill="url(#colorRate)"
                dot={{ fill: '#2196F3', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#2196F3' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
