import { useState, useMemo } from 'react';
import { Trophy, Search } from 'lucide-react';
import { useTaskStore } from '@/modules/task/taskStore';
import { formatHours } from '@/utils/time';

export default function Leaderboard() {
  const getLeaderboard = useTaskStore((state) => state.getLeaderboard);
  const [searchQuery, setSearchQuery] = useState('');

  const entries = useMemo(() => {
    return getLeaderboard();
  }, [getLeaderboard]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter((entry) =>
      entry.userName.toLowerCase().includes(query),
    );
  }, [entries, searchQuery]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bgColor: 'rgba(255, 193, 7, 0.1)',
          borderColor: '#FFC107',
          textColor: '#FFC107',
          glow: '0 0 12px rgba(255, 193, 7, 0.4)',
          trophy: '🥇',
        };
      case 2:
        return {
          bgColor: 'rgba(158, 158, 158, 0.1)',
          borderColor: '#9E9E9E',
          textColor: '#757575',
          glow: '0 0 12px rgba(158, 158, 158, 0.4)',
          trophy: '🥈',
        };
      case 3:
        return {
          bgColor: 'rgba(205, 127, 50, 0.1)',
          borderColor: '#CD7F32',
          textColor: '#CD7F32',
          glow: '0 0 12px rgba(205, 127, 50, 0.4)',
          trophy: '🥉',
        };
      default:
        return {
          bgColor: 'transparent',
          borderColor: 'transparent',
          textColor: '#666',
          glow: 'none',
          trophy: '',
        };
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Trophy className="w-7 h-7 text-yellow-500" />
          团队排行榜
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-56"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-600">
          <div className="col-span-1">排名</div>
          <div className="col-span-5">用户</div>
          <div className="col-span-3 text-right">总工时</div>
          <div className="col-span-3 text-right">完成任务</div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无排行数据</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => {
              const style = getRankStyle(entry.rank);
              return (
                <div
                  key={entry.userId}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-gray-50"
                  style={{
                    backgroundColor: entry.rank % 2 === 0 ? '#F8F8F8' : '#fff',
                    boxShadow: style.glow,
                    borderLeft: `3px solid ${style.borderColor}`,
                  }}
                >
                  <div className="col-span-1 flex items-center gap-2">
                    {entry.rank <= 3 ? (
                      <span className="text-xl" style={{ color: style.textColor }}>
                        {style.trophy}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium w-6 text-center">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  <div className="col-span-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                        style={{ backgroundColor: entry.rank <= 3 ? style.borderColor : '#42A5F5' }}
                      >
                        {entry.userName.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="font-medium"
                        style={{ color: entry.rank <= 3 ? style.textColor : '#333' }}
                      >
                        {entry.userName}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-3 text-right font-semibold text-gray-800">
                    {formatHours(entry.totalHours)}
                  </div>
                  <div className="col-span-3 text-right text-gray-600">
                    {entry.completedTasks} 个
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
