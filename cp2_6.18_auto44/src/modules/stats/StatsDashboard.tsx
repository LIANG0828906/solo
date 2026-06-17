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
import ProgressRing from '@/components/ProgressRing';
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

      <div className="stats-dashboard">
        <ProgressRing percentage={completionRate} />

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-card-label">总任务数</div>
            <div className="stat-card-value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">已完成</div>
            <div className="stat-card-value" style={{ color: '#10B981' }}>
              {completed}
            </div>
          </div>
          <div className="stat-card overdue">
            <div className="stat-card-label">已逾期</div>
            <div className="stat-card-value">{overdue}</div>
          </div>
        </div>

        <div className="member-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={{ stroke: '#E2E8F0' }}
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
                wrapperStyle={{ fontSize: '12px' }}
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
    </>
  );
};

export default React.memo(StatsDashboard);
