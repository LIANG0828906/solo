import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getLeaderboard } from '../utils/storage';

interface LeaderboardProps {
  limit?: number;
  showFull?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 10, showFull = false }) => {
  const { leaderboard, setLeaderboard } = useGameStore();
  const [sortBy, setSortBy] = useState<'score' | 'wave'>('score');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const entries = await getLeaderboard();
    setLeaderboard(entries);
  };

  const sortedEntries = [...leaderboard]
    .sort((a, b) => sortBy === 'score' ? b.score - a.score : b.wave - a.wave)
    .slice(0, limit);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-yellow-400">🏆 排行榜</h3>
        {showFull && (
          <div className="flex gap-2 text-sm">
            <button
              className={`px-3 py-1 rounded ${sortBy === 'score' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setSortBy('score')}
            >
              总分
            </button>
            <button
              className={`px-3 py-1 rounded ${sortBy === 'wave' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setSortBy('wave')}
            >
              波数
            </button>
          </div>
        )}
      </div>

      {sortedEntries.length === 0 ? (
        <p className="text-gray-500 text-center py-4">暂无记录</p>
      ) : (
        <div className="space-y-2">
          {sortedEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between py-2 px-3 rounded ${
                index < 3 ? 'bg-yellow-500/10' : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-bold ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-300' :
                  index === 2 ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {index + 1}
                </span>
                <span className="font-medium">{entry.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-yellow-400">{entry.score}</span>
                <span className="text-gray-500">第{entry.wave}波</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
