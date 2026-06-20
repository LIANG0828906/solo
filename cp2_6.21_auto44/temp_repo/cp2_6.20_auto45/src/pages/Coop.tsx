import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Check, Coins, TrendingUp } from 'lucide-react';
import { useGameStore, Order } from '../stores/useGameStore';
import './CoopAnimations.css';

interface FloatingScore {
  id: string;
  contributionId: string;
  points: number;
  timestamp: number;
}

const OrderCard: React.FC<{ order: Order; index: number }> = ({ order, index }) => {
  const progressPercent = (order.currentAmount / order.targetAmount) * 100;
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progressPercent);
    }, index * 150);
    return () => clearTimeout(timer);
  }, [progressPercent, index]);

  return (
    <div
      className={`
        relative rounded-2xl p-5 border-2 transition-all duration-700 overflow-hidden
        ${order.completed
          ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 grayscale-[30%]'
          : 'bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:border-farm-coopDark hover:shadow-2xl hover:-translate-y-1'
        }
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 完成装饰 */}
      {order.completed && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400" />
      )}

      {/* 金色对勾水印 - 完成时 */}
      {order.completed && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full scale-150" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl border-4 border-yellow-200 animate-gold-check">
              <Check className="w-8 h-8 text-white" strokeWidth={4} />
            </div>
            <div className="absolute -top-1 -left-1 text-yellow-400 animate-sparkle" style={{ animationDelay: '0s' }}>✨</div>
            <div className="absolute -bottom-1 -right-1 text-yellow-400 animate-sparkle" style={{ animationDelay: '0.3s' }}>✨</div>
            <div className="absolute -top-2 right-0 text-xs animate-sparkle" style={{ animationDelay: '0.6s' }}>⭐</div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`
          w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden
          ${order.completed
            ? 'bg-gradient-to-br from-gray-200 to-gray-300'
            : 'bg-gradient-to-br from-blue-100 to-indigo-100'
          }
        `}>
          <span className={`text-5xl ${order.completed ? 'opacity-60 grayscale' : 'transform hover:scale-110 transition-transform duration-300'}`}>
            {order.icon}
          </span>
          {!order.completed && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
          )}
        </div>

        <div className="flex-1 pr-20">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-xl ${order.completed ? 'text-gray-500 line-through decoration-2' : 'text-farm-coopDark'}`}>
              {order.name}
            </h3>
            {order.completed && (
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 text-white text-xs font-bold shadow-md animate-completed-badge">
                任务完成
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-1.5 rounded-full border border-yellow-200">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className={`font-bold ${order.completed ? 'text-gray-500' : 'text-amber-700'}`}>
                +{order.reward} 金币奖励
              </span>
            </div>
            {!order.completed && (
              <div className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                进行中
              </div>
            )}
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${order.completed ? 'text-gray-500' : 'text-gray-600'}`}>
                收集进度
              </span>
              <span className={`font-bold text-base tabular-nums ${
                order.completed 
                  ? 'text-gray-500' 
                  : progressPercent >= 80 
                    ? 'text-emerald-600' 
                    : 'text-farm-green'
              }`}>
                {order.currentAmount} / {order.targetAmount}
              </span>
            </div>

            <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full relative overflow-hidden transition-all duration-[1500ms] ease-out ${
                  order.completed
                    ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400'
                    : 'progress-gradient-green'
                }`}
                style={{ 
                  width: `${displayProgress}%`,
                }}
              >
                {/* 光泽效果 */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent" />
                {/* 流动效果 */}
                {!order.completed && (
                  <div className="absolute inset-0 animate-progress-shimmer"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                )}
                {/* 完成时的庆祝效果 */}
                {order.completed && (
                  <div className="absolute inset-0 animate-completed-confetti">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                          left: `${i * 14}%`,
                          background: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'][i % 5],
                          animation: `confetti-pop 1s ease-out ${i * 0.1}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 进度条末端指示器 */}
              {!order.completed && progressPercent > 5 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-green-500 transition-all duration-[1500ms]"
                  style={{ left: `calc(${displayProgress}% - 8px)` }}
                />
              )}
            </div>

            {/* 百分比标签 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                {[0, 25, 50, 75, 100].map(marker => (
                  <div
                    key={marker}
                    className={`w-1 rounded-full transition-colors duration-300 ${
                      progressPercent >= marker
                        ? order.completed
                          ? 'bg-gray-400'
                          : 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                    style={{ height: marker === 0 || marker === 100 ? '8px' : '6px' }}
                  />
                ))}
              </div>
              <span className={`font-bold text-lg tabular-nums ${
                order.completed
                  ? 'text-gray-500'
                  : progressPercent >= 100
                    ? 'text-amber-500 animate-pulse'
                    : progressPercent >= 50
                      ? 'text-farm-green'
                      : 'text-blue-600'
              }`}>
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContributionRow: React.FC<{
  contribution: ReturnType<typeof useGameStore.getState>['contributions'][0];
  rank: number;
  isCurrentUser: boolean;
  onAddPoints: () => void;
  floatingPoints: number | null;
}> = ({ contribution, rank, isCurrentUser, onAddPoints, floatingPoints }) => {
  return (
    <tr
      className={`
        relative border-b border-gray-100 last:border-0
        transition-all duration-300 group
        ${isCurrentUser ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50' : ''}
        ${rank % 2 === 0 && !isCurrentUser ? 'bg-gray-50/50' : 'bg-white'}
        hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50
      `}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {rank === 0 && (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 rounded-full blur opacity-60 animate-pulse" />
              <span className="relative text-3xl">🥇</span>
            </div>
          )}
          {rank === 1 && (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-300 via-slate-400 to-gray-300 rounded-full blur opacity-50 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="relative text-3xl">🥈</span>
            </div>
          )}
          {rank === 2 && (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-300 via-amber-600 to-orange-300 rounded-full blur opacity-50 animate-pulse" style={{ animationDelay: '0.4s' }} />
              <span className="relative text-3xl">🥉</span>
            </div>
          )}
          {rank > 2 && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${
              isCurrentUser
                ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 border border-gray-300'
            }`}>
              #{rank + 1}
            </div>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md border-2 ${
            isCurrentUser
              ? 'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 border-white'
              : 'bg-gradient-to-br from-gray-100 to-gray-200 border-white'
          }`}>
            <span className="text-xl">👤</span>
          </div>
          <div>
            <div className={`font-semibold ${
              isCurrentUser
                ? 'text-farm-coopDark'
                : 'text-gray-800'
            }`}>
              {contribution.username}
              {isCurrentUser && (
                <span className="ml-2 text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-0.5 rounded-full shadow-md">
                  我
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              农场成员
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-center">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-blue-400">🎯</span>
          <span className={`
            px-4 py-1.5 rounded-full text-sm font-bold shadow-inner
            ${contribution.count >= 10
              ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200'
              : contribution.count >= 5
                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'
                : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
            }
          `}>
            {contribution.count} 次
          </span>
        </div>
      </td>

      <td className="px-5 py-4 text-right relative">
        <div className="inline-flex flex-col items-end gap-1">
          {/* 积分飘出动画 */}
          {floatingPoints !== null && (
            <div className="absolute right-16 -top-2 pointer-events-none">
              <div className="animate-floating-score">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 drop-shadow-lg">
                  +{floatingPoints}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-yellow-500">💎</span>
            <span className="font-black text-2xl tabular-nums bg-gradient-to-r from-farm-green via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {contribution.points.toLocaleString()}
            </span>
          </div>

          {/* 测试按钮 */}
          <button
            onClick={onAddPoints}
            className="text-[10px] text-gray-400 hover:text-farm-green hover:bg-farm-green/10 px-2 py-0.5 rounded transition-colors group-hover:opacity-100 opacity-50"
          >
            +1测试
          </button>
        </div>
      </td>
    </tr>
  );
};

export const Coop: React.FC = () => {
  const { orders, contributions, floatingPoints: storeFloatingPoints, addContributionPoints, user } = useGameStore();

  const sortedContributions = [...contributions].sort((a, b) => b.points - a.points);
  const [visibleFloating, setVisibleFloating] = useState<Record<string, number>>({});

  const handleTestAddPoints = (contributionId: string) => {
    addContributionPoints(contributionId, 1);
    setVisibleFloating(prev => ({ ...prev, [contributionId]: 1 }));
    setTimeout(() => {
      setVisibleFloating(prev => {
        const next = { ...prev };
        delete next[contributionId];
        return next;
      });
    }, 1500);
  };

  const totalPoints = contributions.reduce((sum, c) => sum + c.points, 0);
  const totalContributions = contributions.reduce((sum, c) => sum + c.count, 0);
  const completedCount = orders.filter(o => o.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-farm-coop via-blue-50 to-indigo-50">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      {/* 导航栏 */}
      <nav className="sticky top-0 z-40 bg-gradient-to-r from-farm-coopDark via-indigo-800 to-farm-coopDark px-6 py-4 shadow-2xl border-b-4 border-blue-400/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 hover:bg-white/10 px-4 py-2 rounded-xl hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回农场</span>
            </Link>
            <div className="h-8 w-px bg-white/20" />
            <h1 className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="relative">
                <Users className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 text-lg animate-bounce">🤝</span>
              </div>
              合作任务中心
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur px-5 py-2 rounded-2xl border border-white/20">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
              <span className="text-lg">👤</span>
            </div>
            <span className="text-white font-semibold">{user.username}</span>
          </div>
        </div>
      </nav>

      {/* 统计卡片 */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { icon: '🏆', label: '最高积分', value: sortedContributions[0]?.points || 0, gradient: 'from-yellow-400 via-amber-400 to-orange-400' },
            { icon: '👥', label: '参与玩家', value: contributions.length, gradient: 'from-blue-400 via-cyan-400 to-teal-400' },
            { icon: '✅', label: '已完成订单', value: completedCount, gradient: 'from-green-400 via-emerald-400 to-teal-400' },
            { icon: '💯', label: '团队总积分', value: totalPoints, gradient: 'from-purple-400 via-pink-400 to-rose-400' },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="relative group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300`} />
              <div className="relative bg-white rounded-2xl p-5 shadow-xl border border-white/50 group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="text-4xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{stat.label}</div>
                    <div className={`text-3xl font-black bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent tabular-nums`}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 订单列表 */}
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-white/60" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-farm-coopDark flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-inner">
                    <span className="text-3xl">📋</span>
                  </div>
                  团队订单进度
                </h2>
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200">
                  <span className="text-sm text-gray-600">总贡献</span>
                  <span className="font-bold text-farm-coopDark">{totalContributions} 次</span>
                </div>
              </div>

              <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                {orders.map((order, idx) => (
                  <OrderCard key={order.id} order={order} index={idx} />
                ))}
              </div>
            </div>
          </div>

          {/* 贡献排行榜 */}
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-white/60" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-farm-coopDark flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center shadow-inner">
                    <Trophy className="w-7 h-7 text-yellow-500" />
                  </div>
                  贡献排行榜
                </h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  💡 测试积分动画
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-farm-coopDark via-indigo-800 to-farm-coopDark text-white">
                    <tr>
                      <th className="px-5 py-4 text-left text-sm font-bold">🏅 排名</th>
                      <th className="px-5 py-4 text-left text-sm font-bold">👤 玩家</th>
                      <th className="px-5 py-4 text-center text-sm font-bold">🎯 贡献次数</th>
                      <th className="px-5 py-4 text-right text-sm font-bold">💎 积分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContributions.map((contribution, idx) => (
                      <ContributionRow
                        key={contribution.id}
                        contribution={contribution}
                        rank={idx}
                        isCurrentUser={contribution.username === user.username}
                        onAddPoints={() => handleTestAddPoints(contribution.id)}
                        floatingPoints={visibleFloating[contribution.id] || null}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 我的排名信息 */}
              {(() => {
                const myRank = sortedContributions.findIndex(c => c.username === user.username);
                const myContribution = sortedContributions[myRank];
                if (myRank === -1 || !myContribution) return null;
                return (
                  <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-0.5">我的当前排名</div>
                          <div className="text-2xl font-black text-farm-coopDark">
                            第 {myRank + 1} 名
                            {myRank < 3 && (
                              <span className="ml-2 text-lg">
                                {myRank === 0 ? '🥇' : myRank === 1 ? '🥈' : '🥉'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-0.5">距离上一名还差</div>
                        <div className="text-2xl font-black text-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                          {myRank > 0
                            ? `${sortedContributions[myRank - 1].points - myContribution.points} 分`
                            : '遥遥领先! 🎉'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
