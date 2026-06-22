import { useMemo } from 'react';
import { BurndownChart } from './BurndownChart';
import type { Sprint, Task } from '../types';

interface ReportPageProps {
  sprint: Sprint;
}

export function ReportPage({ sprint }: ReportPageProps) {
  const stats = useMemo(() => {
    const totalTasks = sprint.tasks.length;
    const doneTasks = sprint.tasks.filter((t) => t.column === 'done').length;
    const totalHours = sprint.tasks.reduce((sum, t) => sum + t.estimateHours, 0);
    const doneHours = sprint.tasks
      .filter((t) => t.column === 'done')
      .reduce((sum, t) => sum + t.estimateHours, 0);
    const actualHours = sprint.tasks.reduce((sum, t) => sum + t.actualHours, 0);

    return {
      totalTasks,
      doneTasks,
      totalHours,
      doneHours,
      actualHours,
      completionRate: totalTasks > 0 ? ((doneTasks / totalTasks) * 100).toFixed(0) : '0',
    };
  }, [sprint]);

  const taskByPriority = useMemo(() => {
    const result: Record<string, { total: number; done: number }> = {
      high: { total: 0, done: 0 },
      medium: { total: 0, done: 0 },
      low: { total: 0, done: 0 },
    };
    sprint.tasks.forEach((t) => {
      result[t.priority].total++;
      if (t.column === 'done') {
        result[t.priority].done++;
      }
    });
    return result;
  }, [sprint]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="report-page">
      <h1 className="report-page-title">{sprint.name} - 冲刺报告</h1>
      <div style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>
        {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)} · 共 {totalDays} 天
      </div>

      <div className="report-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.doneTasks}/{stats.totalTasks}</div>
          <div className="stat-label">已完成任务</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completionRate}%</div>
          <div className="stat-label">完成率</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.doneHours}/{stats.totalHours}h</div>
          <div className="stat-label">工时进度</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.actualHours}h</div>
          <div className="stat-label">实际工时</div>
        </div>
      </div>

      <div className="report-chart-container">
        <h3 className="report-chart-title">燃尽图</h3>
        <div className="chart-legend" style={{ marginBottom: '12px' }}>
          <div className="legend-item">
            <span className="legend-line ideal" />
            <span>理想线</span>
          </div>
          <div className="legend-item">
            <span className="legend-line actual" />
            <span>实际线</span>
          </div>
        </div>
        <BurndownChart
          startDate={sprint.startDate}
          endDate={sprint.endDate}
          tasks={sprint.tasks}
          snapshots={sprint.dailySnapshots}
          height={280}
        />
      </div>

      <div className="report-chart-container">
        <h3 className="report-chart-title">按优先级统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              <span style={{ fontWeight: 600, color: '#991B1B' }}>高优先级</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#991B1B' }}>
              {taskByPriority.high.done}/{taskByPriority.high.total}
            </div>
          </div>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <span style={{ fontWeight: 600, color: '#92400E' }}>中优先级</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400E' }}>
              {taskByPriority.medium.done}/{taskByPriority.medium.total}
            </div>
          </div>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
              <span style={{ fontWeight: 600, color: '#166534' }}>低优先级</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>
              {taskByPriority.low.done}/{taskByPriority.low.total}
            </div>
          </div>
        </div>
      </div>

      <div className="report-chart-container">
        <h3 className="report-chart-title">任务列表</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 500 }}>
                  任务
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 500 }}>
                  优先级
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 500 }}>
                  负责人
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 500 }}>
                  预估工时
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748B', fontWeight: 500 }}>
                  状态
                </th>
              </tr>
            </thead>
            <tbody>
              {sprint.tasks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                    暂无任务
                  </td>
                </tr>
              )}
              {sprint.tasks.map((task: Task) => (
                <tr key={task.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 12px', color: '#1E293B' }}>{task.title}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#22C55E',
                        marginRight: '6px',
                        verticalAlign: 'middle',
                      }}
                    />
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748B' }}>{task.assignee || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#64748B' }}>{task.estimateHours}h</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: task.column === 'done' ? '#D1FAE5' : '#F1F5F9',
                        color: task.column === 'done' ? '#065F46' : '#64748B',
                      }}
                    >
                      {task.column === 'backlog' ? 'Backlog' : task.column === 'in-progress' ? '进行中' : task.column === 'testing' ? '测试中' : '已完成'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
