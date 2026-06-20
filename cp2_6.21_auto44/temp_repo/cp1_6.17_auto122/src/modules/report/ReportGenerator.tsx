import React, { useState, useEffect } from 'react';
import { ChartWrapper } from './ChartWrapper';
import type { WeeklyWaterData, CarbonData, MonthlyReport } from '../../../shared/types';
import { fetchWeeklyWater, fetchCarbonReduction, fetchMonthlyReport } from '../../api/api';

const MONTHLY_GOALS = {
  water: 50,
  days: 80,
  mature: 4,
};

export const ReportGenerator: React.FC = () => {
  const [monthly, setMonthly] = useState<MonthlyReport>({
    totalWaterCount: 0,
    totalPlantingDays: 0,
    matureCrops: 0,
  });
  const [weeklyWater, setWeeklyWater] = useState<WeeklyWaterData[]>([]);
  const [carbonData, setCarbonData] = useState<CarbonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [m, w, c] = await Promise.all([
          fetchMonthlyReport(),
          fetchWeeklyWater(),
          fetchCarbonReduction(),
        ]);
        if (!active) return;
        setMonthly(m);
        setWeeklyWater(w);
        setCarbonData(c);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const waterProgress = Math.min(100, (monthly.totalWaterCount / MONTHLY_GOALS.water) * 100);
  const daysProgress = Math.min(100, (monthly.totalPlantingDays / MONTHLY_GOALS.days) * 100);
  const matureProgress = Math.min(100, (monthly.matureCrops / MONTHLY_GOALS.mature) * 100);
  const overallProgress = Math.round((waterProgress + daysProgress + matureProgress) / 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2">
        <div
          className="rounded-2xl p-6 shadow-sm h-full"
          style={{ backgroundColor: '#F5F5F0', borderRadius: '16px' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">📈 月度汇总</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white text-gray-600">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-white rounded-xl">
                <div className="text-xs text-gray-500 mb-1">💧 总浇水次数</div>
                <div className="flex items-baseline gap-1">
                  <span
                    style={{ fontSize: '68px', fontWeight: 300, lineHeight: 1, color: '#42A5F5' }}
                  >
                    {monthly.totalWaterCount}
                  </span>
                  <span className="text-sm text-gray-500 mb-3">次</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${waterProgress}%`, backgroundColor: '#42A5F5' }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">目标 {MONTHLY_GOALS.water} 次</div>
              </div>

              <div className="p-4 bg-white rounded-xl">
                <div className="text-xs text-gray-500 mb-1">🌿 总种植天数</div>
                <div className="flex items-baseline gap-1">
                  <span
                    style={{ fontSize: '68px', fontWeight: 300, lineHeight: 1, color: '#66BB6A' }}
                  >
                    {monthly.totalPlantingDays}
                  </span>
                  <span className="text-sm text-gray-500 mb-3">天</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${daysProgress}%`, backgroundColor: '#66BB6A' }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">目标 {MONTHLY_GOALS.days} 天</div>
              </div>

              <div className="p-4 bg-white rounded-xl">
                <div className="text-xs text-gray-500 mb-1">🌾 作物成熟数量</div>
                <div className="flex items-baseline gap-1">
                  <span
                    style={{ fontSize: '68px', fontWeight: 300, lineHeight: 1, color: '#FFA000' }}
                  >
                    {monthly.matureCrops}
                  </span>
                  <span className="text-sm text-gray-500 mb-3">株</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${matureProgress}%`, backgroundColor: '#FFA000' }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">目标 {MONTHLY_GOALS.mature} 株</div>
              </div>

              <div className="pt-2 border-t border-gray-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">本月目标完成度</span>
                  <span className="text-sm font-semibold" style={{ color: '#388E3C' }}>
                    {overallProgress}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${overallProgress}%`,
                      background: 'linear-gradient(90deg, #81C784 0%, #388E3C 100%)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-3">
        {loading ? (
          <div className="space-y-4">
            <div className="h-60 bg-white rounded-xl animate-pulse" style={{ borderRadius: '16px' }} />
            <div className="h-60 bg-white rounded-xl animate-pulse" style={{ borderRadius: '16px' }} />
          </div>
        ) : (
          <ChartWrapper weeklyWater={weeklyWater} carbonData={carbonData} />
        )}
      </div>
    </div>
  );
};
