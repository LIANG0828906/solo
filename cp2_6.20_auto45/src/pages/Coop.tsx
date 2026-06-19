import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Check } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';

export const Coop: React.FC = () => {
  const { orders, contributions, floatingPoints, addContributionPoints, user } = useGameStore();

  const sortedContributions = [...contributions].sort((a, b) => b.points - a.points);

  const handleTestAddPoints = (contributionId: string) => {
    addContributionPoints(contributionId, 1);
  };

  return (
    <div className="min-h-screen bg-farm-coop">
      {/* 导航栏 */}
      <nav className="bg-farm-coopDark px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回农场
          </Link>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7" />
            合作任务中心
          </h1>
        </div>
        <div className="flex items-center gap-2 text-white">
          <span className="text-xl">👤</span>
          <span className="font-medium">{user.username}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 订单列表 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-farm-coopDark mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              团队订单进度
            </h2>
            <div className="space-y-4">
              {orders.map((order, idx) => (
                <div
                  key={order.id}
                  className={`
                    rounded-xl p-4 border-2 transition-all duration-500
                    ${order.completed 
                      ? 'bg-gray-100 border-gray-300 opacity-80' 
                      : 'bg-white border-farm-coop/50 hover:border-farm-coopDark'
                    }
                  `}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-16 h-16 rounded-xl flex items-center justify-center
                      ${order.completed ? 'bg-gray-200' : 'bg-farm-coop'}
                    `}>
                      <span className="text-4xl">{order.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-lg ${order.completed ? 'text-gray-500 line-through' : 'text-farm-coopDark'}`}>
                          {order.name}
                        </h3>
                        {order.completed && (
                          <span className="flex items-center gap-1 text-yellow-500 font-bold animate-scale-pop">
                            <Check className="w-5 h-5" />
                            已完成
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        奖励: <span className="text-yellow-600 font-bold">+{order.reward} 金币</span>
                      </p>
                      
                      {/* 进度条 */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-600">
                            进度
                          </span>
                          <span className={`font-bold ${order.completed ? 'text-gray-500' : 'text-farm-green'}`}>
                            {order.currentAmount} / {order.targetAmount}
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ease-out ${order.completed ? 'bg-gray-400' : 'order-progress-gradient'}`}
                            style={{ width: `${(order.currentAmount / order.targetAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 贡献排行榜 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-farm-coopDark mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              贡献排行榜
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-farm-coopDark text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold">排名</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">玩家</th>
                    <th className="px-4 py-3 text-center text-sm font-bold">贡献次数</th>
                    <th className="px-4 py-3 text-right text-sm font-bold">积分</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContributions.map((contribution, idx) => {
                    const floatingPoint = floatingPoints.find(f => f.contributionId === contribution.id);
                    const isCurrentUser = contribution.username === user.username;
                    
                    return (
                      <tr
                        key={contribution.id}
                        className={`
                          relative border-b border-gray-100 last:border-0
                          transition-colors
                          ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                          ${isCurrentUser ? 'bg-yellow-50' : ''}
                          hover:bg-farm-coop/20
                        `}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {idx === 0 && <span className="text-2xl">🥇</span>}
                            {idx === 1 && <span className="text-2xl">🥈</span>}
                            {idx === 2 && <span className="text-2xl">🥉</span>}
                            {idx > 2 && (
                              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">👤</span>
                            <span className={`font-medium ${isCurrentUser ? 'text-farm-coopDark font-bold' : 'text-gray-700'}`}>
                              {contribution.username}
                              {isCurrentUser && <span className="text-xs text-farm-green ml-1">(我)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center bg-farm-coop/30 px-3 py-1 rounded-full text-sm font-bold text-farm-coopDark">
                            {contribution.count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right relative">
                          <span className="font-bold text-farm-green text-lg">
                            {contribution.points}
                          </span>
                          {floatingPoint && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 font-bold text-lg animate-float-up pointer-events-none">
                              +{floatingPoint.points}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 测试按钮 - 用于演示积分动画 */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">💡 测试: 点击按钮为玩家添加积分，查看动画效果</p>
              <div className="flex flex-wrap gap-2">
                {sortedContributions.slice(0, 3).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleTestAddPoints(c.id)}
                    className="px-3 py-2 bg-farm-green text-white rounded-lg text-sm font-medium hover:bg-farm-darkGreen transition-colors active:scale-95"
                  >
                    给 {c.username.slice(0, 4)} +1
                  </button>
                ))}
              </div>
            </div>

            {/* 统计信息 */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">🏆</div>
                <div className="text-2xl font-bold text-yellow-700">{sortedContributions[0]?.points || 0}</div>
                <div className="text-xs text-yellow-600">最高积分</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">👥</div>
                <div className="text-2xl font-bold text-blue-700">{contributions.length}</div>
                <div className="text-xs text-blue-600">参与玩家</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">✅</div>
                <div className="text-2xl font-bold text-green-700">{orders.filter(o => o.completed).length}</div>
                <div className="text-xs text-green-600">已完成订单</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
