import React, { useMemo } from 'react';
import { useKanbanStore, TEAM_MEMBERS } from './store';
import { BarChart3, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';

const StatsPanel = React.memo(function StatsPanel() {
  const tasks = useKanbanStore((s) => s.getFilteredTasks());
  const open = useKanbanStore((s) => s.statsPanelOpen);
  const toggle = useKanbanStore((s) => s.toggleStatsPanel);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const notStarted = tasks.filter((t) => t.status === 'not_started').length;

    let totalDelay = 0;
    let delayCount = 0;
    tasks.forEach((t) => {
      if (t.status !== 'completed' && dayjs().isAfter(dayjs(t.endDate))) {
        totalDelay += dayjs().diff(dayjs(t.endDate), 'day');
        delayCount++;
      }
    });
    const avgDelay = delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;

    const byAssignee: Record<string, { total: number; completed: number }> = {};
    TEAM_MEMBERS.forEach((m) => { byAssignee[m.name] = { total: 0, completed: 0 }; });
    tasks.forEach((t) => {
      if (!byAssignee[t.assignee]) byAssignee[t.assignee] = { total: 0, completed: 0 };
      byAssignee[t.assignee].total++;
      if (t.status === 'completed') byAssignee[t.assignee].completed++;
    });

    return { total, completed, inProgress, notStarted, avgDelay, byAssignee };
  }, [tasks]);

  const maxTasks = useMemo(() => {
    return Math.max(...Object.values(stats.byAssignee).map((s) => s.total), 1);
  }, [stats.byAssignee]);

  const donutData = useMemo(() => {
    const { completed, inProgress, notStarted, total } = stats;
    if (total === 0) return { segments: [], total: 0 };
    const segments = [
      { value: completed, color: '#2ed573', label: '已完成' },
      { value: inProgress, color: '#ffa502', label: '进行中' },
      { value: notStarted, color: '#ff4757', label: '未开始' },
    ].filter((s) => s.value > 0);
    return { segments, total };
  }, [stats]);

  const circumference = 2 * Math.PI * 40;
  let accumulatedOffset = 0;

  if (!open) {
    return (
      <button
        onClick={toggle}
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-kanban-card border border-kanban-border rounded-lg shadow-xl btn-hover text-kanban-text text-sm"
      >
        <BarChart3 size={16} className="text-kanban-accent" />
        <span>统计面板</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 w-80 bg-kanban-card border border-kanban-border rounded-xl shadow-2xl animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-kanban-border">
        <div className="flex items-center gap-2 text-sm font-semibold text-kanban-text">
          <BarChart3 size={16} className="text-kanban-accent" />
          统计面板
        </div>
        <button onClick={toggle} className="text-kanban-text-muted hover:text-kanban-text transition-colors text-lg leading-none">&times;</button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-kanban-bg rounded-lg p-3 border border-kanban-border/50">
            <div className="flex items-center gap-1.5 text-[10px] text-kanban-text-muted mb-1">
              <BarChart3 size={10} />总任务
            </div>
            <div className="text-xl font-bold text-kanban-text">{stats.total}</div>
          </div>
          <div className="bg-kanban-bg rounded-lg p-3 border border-kanban-border/50">
            <div className="flex items-center gap-1.5 text-[10px] text-kanban-low mb-1">
              <CheckCircle2 size={10} />已完成
            </div>
            <div className="text-xl font-bold text-kanban-low">{stats.completed}</div>
          </div>
          <div className="bg-kanban-bg rounded-lg p-3 border border-kanban-border/50">
            <div className="flex items-center gap-1.5 text-[10px] text-kanban-medium mb-1">
              <Clock size={10} />进行中
            </div>
            <div className="text-xl font-bold text-kanban-medium">{stats.inProgress}</div>
          </div>
          <div className="bg-kanban-bg rounded-lg p-3 border border-kanban-border/50">
            <div className="flex items-center gap-1.5 text-[10px] text-kanban-high mb-1">
              <AlertTriangle size={10} />平均延期
            </div>
            <div className="text-xl font-bold text-kanban-high">{stats.avgDelay}<span className="text-xs font-normal ml-0.5">天</span></div>
          </div>
        </div>

        <div>
          <div className="text-xs text-kanban-text-muted mb-2 font-medium">按负责人任务分布</div>
          <div className="space-y-2">
            {Object.entries(stats.byAssignee).map(([name, data]) => (
              <div key={name} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-kanban-text">{name}</span>
                  <span className="text-kanban-text-muted">{data.completed}/{data.total}</span>
                </div>
                <div className="h-3 bg-kanban-bg rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-kanban-low rounded-l-full transition-all duration-700 ease-out"
                    style={{ width: data.total > 0 ? `${(data.completed / maxTasks) * 100}%` : '0%' }}
                  />
                  <div
                    className="h-full bg-kanban-medium transition-all duration-700 ease-out"
                    style={{ width: data.total > 0 ? `${((data.total - data.completed) / maxTasks) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-kanban-text-muted">
              <span className="w-2 h-2 rounded-full bg-kanban-low" />已完成
            </div>
            <div className="flex items-center gap-1 text-[10px] text-kanban-text-muted">
              <span className="w-2 h-2 rounded-full bg-kanban-medium" />未完成
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-kanban-text-muted mb-2 font-medium">整体进度分布</div>
          <div className="flex items-center justify-center">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                {donutData.segments.map((segment, idx) => {
                  const percent = donutData.total > 0 ? segment.value / donutData.total : 0;
                  const dashLen = circumference * percent;
                  const offset = accumulatedOffset;
                  accumulatedOffset += dashLen;
                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="8"
                      strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-kanban-text">
                  {donutData.total > 0 ? Math.round((stats.completed / donutData.total) * 100) : 0}%
                </span>
                <span className="text-[9px] text-kanban-text-muted">完成率</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-1">
            {donutData.segments.map((s, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px] text-kanban-text-muted">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label} {s.value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default StatsPanel;
