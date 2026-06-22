import React, { useEffect, useState } from 'react';
import { Trophy, RotateCcw, Home, Star, Zap, Target, XCircle } from 'lucide-react';
import { useGameStore, GameResult } from './store/gameStore';
import { useWebSocket } from './hooks/useWebSocket';

const RANK_COLORS: Record<string, string> = {
  'S': '#ffd700',
  'A': '#a855f7',
  'B': '#3b82f6',
  'C': '#22c55e',
  'D': '#6b7280',
};

export const ResultPanel: React.FC = () => {
  const { results, playerId, resetGame } = useGameStore();
  const { send } = useWebSocket();
  const [showRank, setShowRank] = useState(false);
  const [visibleRanks, setVisibleRanks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (results.length > 0) {
      setShowRank(true);
      results.forEach((result, index) => {
        setTimeout(() => {
          setVisibleRanks(prev => new Set(prev).add(result.playerId));
        }, 300 + index * 400);
      });
    }
  }, [results]);

  const handleRestart = () => {
    send({ type: 'RESTART_GAME' });
  };

  const handleExit = () => {
    send({ type: 'LEAVE_ROOM' });
    resetGame();
  };

  const myResult = results.find(r => r.playerId === playerId);
  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  const myRank = sortedResults.findIndex(r => r.playerId === playerId) + 1;
  const isWinner = myRank === 1 && results.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {showRank && myResult && (
          <div className="text-center mb-8">
            <div className="text-xl text-gray-400 mb-2">
              {isWinner ? '🎉 恭喜获得胜利！' : `排名第 ${myRank} 名`}
            </div>
            <div
              key={`rank-${myResult.rank}`}
              className={`rank-bounce inline-block text-[120px] md:text-[160px] font-black leading-none`}
              style={{
                color: RANK_COLORS[myResult.rank],
                textShadow: `0 0 40px ${RANK_COLORS[myResult.rank]}66, 0 0 80px ${RANK_COLORS[myResult.rank]}44`,
              }}
            >
              {visibleRanks.has(myResult.playerId) ? myResult.rank : '?'}
            </div>
            <div className="text-3xl font-bold text-white mt-2">评级</div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {sortedResults.map((result, index) => (
            <div
              key={result.playerId}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-500 ${
                result.playerId === playerId ? 'border-indigo-500 scale-[1.02]' : 'border-white/10'
              } ${!visibleRanks.has(result.playerId) ? 'opacity-50' : 'opacity-100'}`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {index === 0 && results.length > 1 && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{
                      background: index === 0 && results.length > 1
                        ? 'linear-gradient(135deg, #ffd700, #ffaa00)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    }}
                  >
                    {result.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{result.nickname}</div>
                    <div className="text-sm text-gray-400">
                      {result.playerId === playerId && '（你）'}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-5xl font-black ${visibleRanks.has(result.playerId) ? 'rank-bounce' : 'opacity-0'}`}
                  style={{
                    color: RANK_COLORS[result.rank],
                  }}
                >
                  {visibleRanks.has(result.playerId) ? result.rank : ''}
                </div>
              </div>

              <div className="text-center py-4 mb-4 rounded-xl bg-black/30">
                <div className="text-sm text-gray-400 mb-1">最终得分</div>
                <div className="text-4xl font-bold text-white">{result.score.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                  <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                  <div className="text-xl font-bold text-yellow-400">{result.perfect}</div>
                  <div className="text-xs text-gray-400">Perfect</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <Zap className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <div className="text-xl font-bold text-green-400">{result.good}</div>
                  <div className="text-xs text-gray-400">Good</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <div className="text-xl font-bold text-red-400">{result.miss}</div>
                  <div className="text-xs text-gray-400">Miss</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-400">最高连击</span>
                </div>
                <div className="text-xl font-bold text-purple-400">{result.maxCombo}</div>
              </div>

              <div className="mt-2 flex items-center justify-between px-3">
                <span className="text-sm text-gray-400">累计胜场</span>
                <div className="text-lg font-semibold text-indigo-400">{result.wins} 胜</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="btn-glow bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 px-10 rounded-xl flex items-center justify-center gap-2 text-lg"
          >
            <RotateCcw className="w-5 h-5" />
            再来一局
          </button>
          <button
            onClick={handleExit}
            className="btn-glow bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-4 px-10 rounded-xl flex items-center justify-center gap-2 text-lg"
          >
            <Home className="w-5 h-5" />
            返回大厅
          </button>
        </div>
      </div>
    </div>
  );
};
