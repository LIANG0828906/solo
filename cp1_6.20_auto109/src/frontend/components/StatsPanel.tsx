import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Task, TeamMember, MemberStats, priorityColors } from '../types';

interface StatsPanelProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  stats: MemberStats[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
}

type ViewType = 'bar' | 'gantt';

const StatsPanel: React.FC<StatsPanelProps> = ({
  tasks,
  teamMembers,
  stats,
  selectedMemberId,
  onSelectMember,
}) => {
  const [view, setView] = useState<ViewType>('bar');
  const [drillDownMember, setDrillDownMember] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const barChartData = useMemo(() => {
    return stats.map((s) => ({
      name: s.memberName,
      任务总数: s.totalTasks,
      待办: s.todo,
      进行中: s.inProgress,
      已完成: s.done,
      color: s.avatarColor,
      memberId: s.memberId,
    }));
  }, [stats]);

  const drillDownData = useMemo(() => {
    if (!drillDownMember) return [];
    const memberTasks = tasks.filter((t) => t.assigneeId === drillDownMember);
    const dateMap = new Map<string, { 待办: number; 进行中: number; 已完成: number }>();

    memberTasks.forEach((task) => {
      const date = task.dueDate;
      if (!dateMap.has(date)) {
        dateMap.set(date, { 待办: 0, 进行中: 0, 已完成: 0 });
      }
      const entry = dateMap.get(date)!;
      if (task.status === 'todo') entry.待办++;
      else if (task.status === 'in-progress') entry.进行中++;
      else if (task.status === 'done') entry.已完成++;
    });

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [drillDownMember, tasks]);

  const ganttData = useMemo(() => {
    const sortedTasks = [...tasks]
      .filter((t) => t.startDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const allDates = sortedTasks.flatMap((t) => [t.startDate!, t.dueDate]);
    const minDate = allDates.length
      ? new Date(Math.min(...allDates.map((d) => new Date(d).getTime())))
      : new Date();
    const maxDate = allDates.length
      ? new Date(Math.max(...allDates.map((d) => new Date(d).getTime())))
      : new Date();

    const totalDays = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    ) || 1;

    return sortedTasks.map((task) => {
      const startDays = Math.ceil(
        (new Date(task.startDate!).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const durationDays = Math.ceil(
        (new Date(task.dueDate).getTime() - new Date(task.startDate!).getTime()) /
          (1000 * 60 * 60 * 24)
      ) || 1;

      const assignee = teamMembers.find((m) => m.id === task.assigneeId);

      let barColor = priorityColors[task.priority];
      let opacity = 1;
      if (task.status === 'done') {
        barColor = '#2ECC71';
        opacity = 0.6;
      } else if (task.priority === 'urgent') {
        barColor = '#FF6B6B';
      }

      return {
        id: task.id,
        name: task.title,
        startOffset: (startDays / totalDays) * 100,
        width: (durationDays / totalDays) * 100,
        color: barColor,
        opacity,
        assignee: assignee?.name || '未分配',
        priority: task.priority,
        status: task.status,
        startDate: task.startDate,
        dueDate: task.dueDate,
      };
    });
  }, [tasks, teamMembers]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const memberId = data.activePayload[0].payload.memberId;
      if (drillDownMember === memberId) {
        setDrillDownMember(null);
      } else {
        setDrillDownMember(memberId);
      }
    }
  };

  const memberPieData = (memberId: string) => {
    const memberStat = stats.find((s) => s.memberId === memberId);
    if (!memberStat) return [];
    return [
      { name: '待办', value: memberStat.todo, color: '#FFA502' },
      { name: '进行中', value: memberStat.inProgress, color: '#45B7D1' },
      { name: '已完成', value: memberStat.done, color: '#2ECC71' },
    ];
  };

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h2 className="stats-title">📊 数据统计</h2>
        <div className="stats-tabs">
          <button
            className={`stats-tab ${view === 'bar' ? 'active' : ''}`}
            onClick={() => setView('bar')}
          >
            柱状图
          </button>
          <button
            className={`stats-tab ${view === 'gantt' ? 'active' : ''}`}
            onClick={() => setView('gantt')}
          >
            甘特图
          </button>
        </div>
      </div>

      {view === 'gantt' && (
        <div className="date-filter">
          <span style={{ fontSize: 13, color: '#666' }}>日期筛选：</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            placeholder="开始日期"
          />
          <span style={{ color: '#999' }}>-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            placeholder="结束日期"
          />
        </div>
      )}

      <div className="stats-content" key={view}>
        {view === 'bar' && (
          <div>
            <div style={{ height: drillDownMember ? 250 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="待办" fill="#FFA502" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="进行中" fill="#45B7D1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="已完成" fill="#2ECC71" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {drillDownMember && (
              <div style={{ marginTop: 20, animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
                  {stats.find((s) => s.memberId === drillDownMember)?.memberName} 的任务时间分布
                  <button
                    onClick={() => setDrillDownMember(null)}
                    style={{
                      marginLeft: 10,
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    返回
                  </button>
                </h3>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={drillDownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="待办"
                        stackId="1"
                        stroke="#FFA502"
                        fill="#FFA502"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="进行中"
                        stackId="1"
                        stroke="#45B7D1"
                        fill="#45B7D1"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="已完成"
                        stackId="1"
                        stroke="#2ECC71"
                        fill="#2ECC71"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="team-members-grid" style={{ marginTop: 20 }}>
              {stats.map((stat) => (
                <div
                  key={stat.memberId}
                  className={`member-card ${selectedMemberId === stat.memberId ? 'selected' : ''}`}
                  onClick={() =>
                    onSelectMember(
                      selectedMemberId === stat.memberId ? null : stat.memberId
                    )
                  }
                >
                  <div
                    className="avatar"
                    style={{ background: stat.avatarColor, width: 44, height: 44, fontSize: 16 }}
                  >
                    {stat.memberName.charAt(0)}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{stat.memberName}</div>
                    <div className="member-role">
                      共 {stat.totalTasks} 个任务
                    </div>
                  </div>
                  <div className="pie-chart-small">
                    <PieChart width={50} height={50}>
                      <Pie
                        data={memberPieData(stat.memberId)}
                        innerRadius={15}
                        outerRadius={22}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {memberPieData(stat.memberId).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'gantt' && (
          <div className="gantt-container">
            {ganttData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-text">暂无甘特图数据</div>
              </div>
            ) : (
              <div style={{ minWidth: 600 }}>
                {ganttData.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 10,
                      gap: 10,
                    }}
                    className="fade-in-up"
                  >
                    <div
                      style={{
                        width: 140,
                        fontSize: 12,
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 24,
                        background: '#f0f0f0',
                        borderRadius: 4,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: `${item.startOffset}%`,
                          width: `${item.width}%`,
                          height: '100%',
                          background: item.color,
                          opacity: item.opacity,
                          borderRadius: 4,
                          transition: 'all 0.3s ease',
                        }}
                        title={`${item.startDate} ~ ${item.dueDate}\n负责人: ${item.assignee}`}
                      />
                    </div>
                    <div style={{ width: 60, fontSize: 11, color: '#999', textAlign: 'right' }}>
                      {item.assignee}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid #eee',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ width: 12, height: 12, background: '#FF6B6B', borderRadius: 2 }} />
                    紧急
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ width: 12, height: 12, background: '#FFA502', borderRadius: 2 }} />
                    高优先级
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ width: 12, height: 12, background: '#2ECC71', borderRadius: 2, opacity: 0.6 }} />
                    已完成
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;
