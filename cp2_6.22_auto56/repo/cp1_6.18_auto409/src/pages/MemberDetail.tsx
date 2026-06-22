import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import ProgressChart from '@/components/ProgressChart';
import { ChevronLeft } from 'lucide-react';

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetail, loading, error, fetchUserDetail } = useUserStore();

  useEffect(() => {
    if (id) {
      fetchUserDetail(Number(id));
    }
  }, [id, fetchUserDetail]);

  const stepsData =
    userDetail?.records.map((r) => ({ date: r.date, steps: r.steps })) ?? [];

  return (
    <div className="min-h-screen bg-[#121220] p-6 md:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-2 rounded-lg px-4 py-2 transition-colors text-white"
          style={{ backgroundColor: '#1E1E2E', padding: '8px 16px' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = '#2A2A3E')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = '#1E1E2E')
          }
        >
          <ChevronLeft className="w-5 h-5" />
          <span>返回排行榜</span>
        </button>

        {loading && (
          <div className="flex flex-col gap-6">
            <div className="h-40 bg-[#1E1E2E] rounded-2xl animate-pulse border border-[#2A2A3E]" />
            <div className="h-80 bg-[#1E1E2E] rounded-2xl animate-pulse border border-[#2A2A3E]" />
            <div className="h-80 bg-[#1E1E2E] rounded-2xl animate-pulse border border-[#2A2A3E]" />
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

        {!loading && !error && userDetail && (
          <>
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: '#1E1E2E',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div className="flex flex-col gap-6">
                <h2 className="text-3xl font-bold text-white">
                  {userDetail.nickname}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-[#A0A0B8]">总步数</span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: '#00D4AA' }}
                    >
                      {userDetail.total_steps.toLocaleString()} 步
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-[#A0A0B8]">总卡路里</span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: '#FFD700' }}
                    >
                      {userDetail.total_calories.toLocaleString()} kcal
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-[#A0A0B8]">平均每日时长</span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: '#4A90D9' }}
                    >
                      {userDetail.avg_duration} 分钟
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-[#A0A0B8]">运动天数</span>
                    <span className="text-2xl font-bold text-white">
                      {userDetail.records.length} 天
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-white">近7天步数趋势</h3>
              <ProgressChart
                chartType="line"
                data={stepsData}
                xKey="date"
                yKeys={[{ key: 'steps', color: '#00D4AA', name: '步数' }]}
              />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-white">
                每日锻炼时长(分钟)
              </h3>
              <ProgressChart
                chartType="bar"
                data={userDetail.records}
                xKey="date"
                yKeys={[{ key: 'duration', color: '#4A90D9', name: '时长' }]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
