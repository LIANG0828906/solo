import React, { useMemo, useState } from 'react';
import { Clock, Target, TrendingUp, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { useApp } from '../state/store';
import { PomodoroChart, COLORS } from './PomodoroChart';

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  return `${m} 分钟`;
}

export const StatsPanel: React.FC = () => {
  const { state } = useApp();
  const [mobileExpanded, setMobileExpanded] = useState(true);

  const stats = useMemo(() => {
    const todayRecords = state.pomodoroRecords.filter((r) => isToday(r.completedAt));
    const totalPomodoros = todayRecords.length;
    const totalMinutes = todayRecords.reduce((acc, r) => acc + r.duration, 0);

    const taskPomodoros = new Map<string, number>();
    todayRecords.forEach((r) => {
      taskPomodoros.set(r.taskId, (taskPomodoros.get(r.taskId) || 0) + 1);
    });

    const chartItems = Array.from(taskPomodoros.entries())
      .map(([taskId, value], idx) => {
        const task = state.tasks.find((t) => t.id === taskId);
        return task
          ? {
              task,
              value,
              color: COLORS[idx % COLORS.length],
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.value - a!.value) as NonNullable<ReturnType<typeof Object>>[];

    const totalTasks = state.tasks.length;
    const doneTasks = state.tasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = state.tasks.filter((t) => t.status === 'in_progress').length;

    return {
      totalPomodoros,
      totalMinutes,
      chartItems,
      totalTasks,
      doneTasks,
      inProgressTasks,
    };
  }, [state.pomodoroRecords, state.tasks]);

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  }, []);

  const StatCard = ({
    icon,
    label,
    value,
    subValue,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
  }) => (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 14,
        padding: 16,
        border: '1px solid var(--border-color)',
        transition: 'all 0.4s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${color}20`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          marginBottom: subValue ? 4 : 0,
        }}
      >
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subValue}</div>
      )}
    </div>
  );

  const content = (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 4,
            }}
          >
            今日概览
          </h2>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Calendar size={12} />
            {todayStr}
          </div>
        </div>
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          aria-label={mobileExpanded ? '收起' : '展开'}
          className="mobile-only"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mobileExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {mobileExpanded && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <StatCard
              icon={<Target size={18} />}
              label="今日番茄"
              value={stats.totalPomodoros}
              subValue={`${stats.totalPomodoros >= 8 ? '太棒了！' : stats.totalPomodoros >= 4 ? '继续加油！' : '开始你的第一个番茄吧'}`}
              color="var(--success-color)"
            />
            <StatCard
              icon={<Clock size={18} />}
              label="专注时长"
              value={formatDuration(stats.totalMinutes)}
              subValue={stats.totalMinutes > 0 ? `约等于 ${Math.round(stats.totalMinutes / 60 * 10) / 10} 小时` : '专注时间将在这里显示'}
              color="var(--accent-color)"
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="任务进度"
              value={`${stats.doneTasks}/${stats.totalTasks}`}
              subValue={
                stats.totalTasks > 0
                  ? `完成率 ${Math.round((stats.doneTasks / stats.totalTasks) * 100)}%`
                  : '添加任务开始追踪'
              }
              color="var(--warning-color)"
            />
            <StatCard
              icon={<Target size={18} />}
              label="进行中"
              value={stats.inProgressTasks}
              subValue={stats.inProgressTasks > 0 ? '有任务正在处理中' : '暂无进行中的任务'}
              color="#9b59b6"
            />
          </div>

          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 14,
              padding: 16,
              border: '1px solid var(--border-color)',
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 4,
              }}
            >
              🍅 番茄分布
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, marginBottom: 8 }}>
              按任务统计今日番茄钟占比
            </p>
            <PomodoroChart items={stats.chartItems} total={stats.totalPomodoros} />
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(52, 152, 219, 0.1))',
              borderRadius: 14,
              padding: 16,
              border: '1px solid rgba(39, 174, 96, 0.2)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success-color)', marginBottom: 8 }}>
              💡 今日激励
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {stats.totalPomodoros === 0
                ? '每一个伟大的旅程，都从第一步开始。今天的第一个番茄钟，将改变你的一切！'
                : stats.totalPomodoros < 4
                  ? `你已经完成了 ${stats.totalPomodoros} 个番茄钟，节奏很好！专注 25 分钟，休息 5 分钟，保持平衡。`
                  : stats.totalPomodoros < 8
                    ? `太棒了！${stats.totalPomodoros} 个番茄钟已经达成。你的效率正在超越大多数人，继续保持！`
                    : `不可思议！${stats.totalPomodoros} 个番茄钟！你今天完全掌控了自己的时间，值得一次好好的休息！🎉`}
            </div>
          </div>
        </>
      )}
    </>
  );

  return <>{content}</>;
};
