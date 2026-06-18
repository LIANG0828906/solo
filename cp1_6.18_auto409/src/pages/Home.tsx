import React, { useEffect } from 'react';
import { useRankingStore } from '@/stores/rankingStore';
import RankingList from '@/components/RankingList';

export default function Home() {
  const { rankings, loading, error, timeRange, setTimeRange, fetchRankings } =
    useRankingStore();

  useEffect(() => {
    fetchRankings();
    const interval = setInterval(() => {
      fetchRankings();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchRankings]);

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const days = Number(e.target.value);
    setTimeRange(days);
    fetchRankings(days);
  };

  return (
    <div className="min-h-screen bg-[#121220] p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1
            className="font-bold"
            style={{ color: '#FFFFFF', fontSize: '28px' }}
          >
            健身热力榜
          </h1>
          <p style={{ color: '#A0A0B8', fontSize: '14px' }}>
            团队运动排行榜，见证每一份坚持
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="bg-[#1E1E2E] text-white border border-[#2A2A3E] rounded-lg px-4 py-2 outline-none cursor-pointer hover:border-[#00D4AA] transition-colors"
          >
            <option value={7}>近7天</option>
            <option value={14}>近14天</option>
            <option value={30}>近30天</option>
          </select>
        </div>

        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[#1E1E2E] rounded-2xl animate-pulse border border-[#2A2A3E]"
              />
            ))}
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

        {!loading && !error && (
          <div key={timeRange} className="fade-transition">
            <RankingList data={rankings} />
          </div>
        )}
      </div>
    </div>
  );
}
