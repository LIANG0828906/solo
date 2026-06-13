import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Plus,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import type { TeamMember, LoadData } from '@/utils/types';

interface SidebarProps {
  members: TeamMember[];
  loadData: LoadData[];
  collapsed: boolean;
  onToggle: () => void;
  averageLoad: number;
}

export function Sidebar({
  members,
  loadData,
  collapsed,
  onToggle,
  averageLoad,
}: SidebarProps) {
  const getMemberLoad = (memberId: string) => {
    return loadData.find((l) => l.memberId === memberId);
  };

  return (
    <aside
      className="flex flex-col h-screen text-white transition-all duration-300 relative flex-shrink-0"
      style={{
        width: collapsed ? '72px' : '240px',
        backgroundColor: '#1a237e',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-5 border-b border-white/10"
        style={{ minHeight: '64px' }}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                <LayoutDashboard size={18} />
              </div>
              <div>
                <h1
                  className="font-bold text-base"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  SmartTask
                </h1>
                <p className="text-[10px] text-indigo-200">智能协作看板</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <LayoutDashboard size={20} />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        <div>
          {!collapsed && (
            <div className="px-2 mb-2">
              <p className="text-[10px] uppercase tracking-wider text-indigo-300/70 font-semibold">
                团队概览
              </p>
            </div>
          )}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-400" />
              {!collapsed && (
                <span className="text-xs font-medium">平均负载</span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: 'Poppins' }}
              >
                {averageLoad}%
              </span>
              {!collapsed && (
                <div
                  className={`
                    text-[10px] px-2 py-0.5 rounded-full font-medium
                    ${
                      averageLoad > 80
                        ? 'bg-red-500/20 text-red-300'
                        : averageLoad > 60
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }
                  `}
                >
                  {averageLoad > 80 ? '过载' : averageLoad > 60 ? '健康' : '偏低'}
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full progress-gradient rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(averageLoad, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          {!collapsed && (
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[10px] uppercase tracking-wider text-indigo-300/70 font-semibold">
                团队成员
              </p>
              <button className="p-1 rounded hover:bg-white/10 transition-colors">
                <Plus size={12} />
              </button>
            </div>
          )}
          <div className="space-y-1">
            {members.map((member) => {
              const load = getMemberLoad(member.id);
              const loadPercent = load?.loadPercentage || 0;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white relative z-10"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.avatar}
                    </div>
                    {load && loadPercent > 80 && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1a237e]" />
                    )}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {member.name}
                        </span>
                        <span
                          className={`
                            text-[10px] font-medium px-1.5 rounded
                            ${
                              loadPercent > 80
                                ? 'bg-red-500/30 text-red-300'
                                : loadPercent > 50
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-white/10 text-indigo-200'
                            }
                          `}
                        >
                          {loadPercent}%
                        </span>
                      </div>
                      <div className="text-[10px] text-indigo-200/60 mt-0.5">
                        {load?.taskCount || 0} 个任务
                      </div>
                      <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(loadPercent, 100)}%`,
                            backgroundColor:
                              loadPercent > 80
                                ? '#ef4444'
                                : loadPercent > 50
                                ? '#22c55e'
                                : member.color,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <button className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-indigo-200 hover:text-white">
          <BarChart3 size={18} />
          {!collapsed && <span className="text-sm">数据分析</span>}
        </button>
        <button className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-indigo-200 hover:text-white mt-1">
          <LayoutDashboard size={18} />
          {!collapsed && <span className="text-sm">设置</span>}
        </button>
        {collapsed && (
          <button
            onClick={onToggle}
            className="mt-2 w-full p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex justify-center"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
