import React, { useMemo } from 'react';
import { useIdeaStore } from '@/store';

const GradientRing: React.FC<{
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
}> = ({ value, maxValue, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const dashOffset = circumference - (percent / 100) * circumference;
  const gradientId = `ring-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
};

const Dashboard: React.FC = () => {
  const { ideas, isSidebarOpen, setSidebarOpen } = useIdeaStore();

  const stats = useMemo(() => {
    const totalIdeas = ideas.length;

    const scoredIdeas = ideas.filter((i) => i.creativeScore > 0);
    const avgScore =
      scoredIdeas.length > 0
        ? scoredIdeas.reduce((acc, i) => acc + i.creativeScore, 0) / scoredIdeas.length
        : 0;

    const totalMilestones = ideas.reduce((acc, i) => acc + i.milestones.length, 0);
    const completedMilestones = ideas.reduce(
      (acc, i) => acc + i.milestones.filter((m) => m.completed).length,
      0
    );
    const completionRate =
      totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    const statusCounts = ideas.reduce(
      (acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalIdeas,
      avgScore,
      totalMilestones,
      completedMilestones,
      completionRate,
      statusCounts,
    };
  }, [ideas]);

  const statusConfig = [
    { key: 'fresh', label: '新鲜想法', color: '#a78bfa', emoji: '💡' },
    { key: 'hatching', label: '正在孵化', color: '#34d399', emoji: '🐣' },
    { key: 'launched', label: '已启动', color: '#fb923c', emoji: '🚀' },
    { key: 'abandoned', label: '已放弃', color: '#9ca3af', emoji: '💤' },
  ];

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 animate-modal-fade md:hidden"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-80 glass z-50 md:z-40 flex flex-col border-r border-white/10 ${
          isSidebarOpen ? 'animate-slide-in' : 'hidden'
        }`}
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.98) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              全局仪表盘
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">灵感孵化统计总览</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="glass glass-hover p-2 rounded-xl text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="glass p-5 animate-scale-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">总灵感数</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-5xl font-extrabold bg-gradient-to-br from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {stats.totalIdeas}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  最多可创建 20 个灵感
                </div>
              </div>
              <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${(stats.totalIdeas / 20) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glass p-5 animate-scale-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">平均创意评分</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <GradientRing value={stats.avgScore} maxValue={5} size={100} strokeWidth={8} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">
                    {stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500">满分 5.0</div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ideas.filter((i) => i.creativeScore === star).length;
                  const maxCount = Math.max(
                    ...[5, 4, 3, 2, 1].map((s) => ideas.filter((i) => i.creativeScore === s).length),
                    1
                  );
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-amber-400 text-xs w-8">{star} ★</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            opacity: count > 0 ? 1 : 0.2,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="glass p-5 animate-pulse-border animate-scale-in"
            style={{ animationDelay: '0.1s', borderColor: 'rgba(52, 211, 153, 0.2)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">里程碑完成率</span>
            </div>
            <div className="mb-4">
              <div className="flex items-end justify-between mb-2">
                <div className="text-4xl font-extrabold text-emerald-400">
                  {stats.completionRate}%
                </div>
                <div className="text-xs text-slate-500 mb-1">
                  {stats.completedMilestones} / {stats.totalMilestones} 已完成
                </div>
              </div>
              <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
              <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                <div className="text-lg font-bold text-slate-200">{stats.totalMilestones}</div>
                <div className="text-[10px] text-slate-500">总里程碑</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                <div className="text-lg font-bold text-emerald-400">
                  {stats.totalMilestones - stats.completedMilestones}
                </div>
                <div className="text-[10px] text-slate-500">进行中</div>
              </div>
            </div>
          </div>

          <div className="glass p-5 animate-scale-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">状态分布</span>
            </div>
            <div className="space-y-2.5">
              {statusConfig.map(({ key, label, color, emoji }) => {
                const count = stats.statusCounts[key] || 0;
                const percent =
                  stats.totalIdeas > 0 ? (count / stats.totalIdeas) * 100 : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span>{emoji}</span>
                        <span style={{ color }}>{label}</span>
                      </span>
                      <span className="text-slate-400 font-medium">
                        {count}
                        <span className="text-slate-600 ml-1">({percent.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          background: color,
                          opacity: count > 0 ? 0.7 : 0.2,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center py-2 text-[10px] text-slate-600">
            数据存储于浏览器本地 · 刷新不丢失
          </div>
        </div>
      </aside>
    </>
  );
};

export default Dashboard;
