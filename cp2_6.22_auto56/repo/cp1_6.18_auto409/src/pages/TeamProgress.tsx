import React, { useEffect } from 'react';
import { useTeamStore } from '@/stores/teamStore';
import ProgressChart from '@/components/ProgressChart';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Footprints, Flame, CalendarCheck } from 'lucide-react';

export default function TeamProgress() {
  const { teamProgress, loading, error, fetchTeamProgress } = useTeamStore();

  useEffect(() => {
    fetchTeamProgress();
  }, [fetchTeamProgress]);

  const goalSteps = 100000;
  const currentSteps = teamProgress?.current_day_steps ?? 0;
  const pieData = [
    { name: '已完成', value: currentSteps },
    { name: '未完成', value: Math.max(0, goalSteps - currentSteps) },
  ];
  const pieColors = ['#00D4AA', '#2A2A3E'];
  const completionPercent = Math.min(
    100,
    Math.round((currentSteps / goalSteps) * 100)
  );

  return (
    <div className="min-h-screen bg-[#121220] p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <h1
          className="font-bold"
          style={{ color: '#FFFFFF', fontSize: '28px' }}
        >
          团队进度
        </h1>

        {loading && (
          <div className="flex flex-col gap-6">
            <div className="h-40 bg-[#1E1E2E] rounded-2xl animate-pulse border border-[#2A2A3E]" />
            <div className="h-80 bg-[#1E1E2E] rounded-2xl animate-pulse border border-[#2A2A3E]" />
            <div className="h-80 bg-[#1E1E2E] rounded-2xl animate-pulse border border-[#2A2A3E]" />
            <div className="h-96 bg-[#1E1E2E] rounded-2xl animate-pulse border border-[#2A2A3E]" />
          </div>
        )}

        {error && !loading && (
          <div
            className="bg-[#FF6B6B15] border border-[#FF6B6B30] rounded-2xl p-6 text-center"
            style={{ color: '#FF6B6B' }}
          >
            {error}
          </div>
        )}

        {!loading && !error && teamProgress && (
          <>
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: '#1E1E2E',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#00D4AA20' }}
                  >
                    <Footprints
                      className="w-7 h-7"
                      style={{ color: '#00D4AA' }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[#A0A0B8]">团队总步数</span>
                    <span className="text-2xl font-bold text-white">
                      {teamProgress.total_steps.toLocaleString()} 步
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#FFD70020' }}
                  >
                    <Flame
                      className="w-7 h-7"
                      style={{ color: '#FFD700' }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[#A0A0B8]">总卡路里</span>
                    <span className="text-2xl font-bold text-white">
                      {teamProgress.total_calories.toLocaleString()} kcal
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#4A90D920' }}
                  >
                    <CalendarCheck
                      className="w-7 h-7"
                      style={{ color: '#4A90D9' }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[#A0A0B8]">目标完成天数</span>
                    <span className="text-2xl font-bold text-white">
                      {teamProgress.goal_days} 天
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-white">
                30天团队步数趋势
              </h3>
              <ProgressChart
                chartType="area"
                data={teamProgress.daily_totals}
                xKey="date"
                yKeys={[
                  { key: 'total_steps', color: '#FF6B6B', name: '总步数' },
                ]}
                gradientFill={true}
              />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-white">
                每日平均卡路里
              </h3>
              <ProgressChart
                chartType="bar"
                data={teamProgress.daily_totals}
                xKey="date"
                yKeys={[
                  { key: 'avg_calories', color: '#FFD700', name: '平均卡路里' },
                ]}
              />
            </div>

            <div
              className="rounded-2xl"
              style={{
                backgroundColor: '#1E1E2E',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                今日目标完成度（10万步）
              </h3>
              <div className="relative w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      data={pieData}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E1E2E',
                        border: '1px solid #2A2A3E',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                      }}
                      labelStyle={{ color: '#FFFFFF' }}
                      formatter={(value: number) =>
                        value.toLocaleString() + ' 步'
                      }
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: '#A0A0B8' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-white">
                    {currentSteps.toLocaleString()}
                  </span>
                  <span className="text-sm text-[#A0A0B8] mt-1">步</span>
                  <span
                    className="text-2xl font-bold mt-2"
                    style={{ color: '#00D4AA' }}
                  >
                    {completionPercent}%
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
