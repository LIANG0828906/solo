import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ListTodo, CheckCircle2, AlertTriangle } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import RecentActivities from '@/components/RecentActivities';
import { useProjectStats, useTaskStore } from '@/store/taskStore';

const StatsDashboard: React.FC = () => {
  const { total, completed, overdue, completionRate, memberStats } = useProjectStats();
  const { currentProjectId, projects } = useTaskStore();

  const chartData = useMemo(() => {
    return memberStats.map((stat) => ({
      name: stat.memberName,
      已完成: stat.completed,
      进行中: stat.total - stat.completed,
    }));
  }, [memberStats]);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId),
    [projects, currentProjectId]
  );

  if (!currentProjectId) {
    return null;
  }

  return (
    <>
      <div className="main-header">
        <h1 className="main-title">{currentProject?.name || '项目看板'}</h1>
      </div>

      <div className="stats-section">
        <div className="stats-top-row">
          <ProgressRing
            percentage={completionRate}
            completedCount={completed}
            totalCount={total}
          />

          <div className="stats-cards-row">
            <div className="enhanced-stat-card stat-card-total">
              <div className="stat-card-icon">
                <ListTodo size={24} />
              </div>
              <div className="stat-card-content">
                <div className="stat-card-label">总任务数</div>
                <div className="stat-card-value">{total}</div>
              </div>
            </div>

            <div className="enhanced-stat-card stat-card-completed">
              <div className="stat-card-icon">
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-card-content">
                <div className="stat-card-label">已完成</div>
                <div className="stat-card-value">{completed}</div>
              </div>
            </div>

            <div className="enhanced-stat-card stat-card-overdue">
              <div className="stat-card-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="stat-card-content">
                <div className="stat-card-label">已逾期</div>
                <div className="stat-card-value">{overdue}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-bottom-row">
          <div className="member-chart-wrapper">
            <h3 className="chart-title">成员任务分配</h3>
            <div className="member-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="已完成"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="进行中"
                    fill="#6366F1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <RecentActivities />
        </div>
      </div>
    </>
  );
};

export default React.memo(StatsDashboard);
