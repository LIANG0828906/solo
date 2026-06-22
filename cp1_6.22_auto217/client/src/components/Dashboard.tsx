import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { Course, UserProgress, DailyActivity } from '../../../shared/types';

interface DashboardProps {
  courses: Course[];
  progress: UserProgress[];
  activity: DailyActivity[];
}

const STATUS_COLORS: Record<string, string> = {
  not_started: '#9CA3AF',
  in_progress: '#F59E0B',
  completed: '#10B981'
};

const STATUS_LABELS: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成'
};

export default function Dashboard({ courses, progress, activity }: DashboardProps) {
  const stats = useMemo(() => {
    const totalMinutes = progress.reduce((sum, p) => sum + p.minutesSpent, 0);
    const completedCount = progress.filter(p => p.status === 'completed').length;
    const completedWithScore = progress.filter(p => p.status === 'completed' && p.testScore > 0);
    const avgScore = completedWithScore.length > 0
      ? Math.round(completedWithScore.reduce((sum, p) => sum + p.testScore, 0) / completedWithScore.length)
      : 0;
    return { totalMinutes, completedCount, avgScore };
  }, [progress]);

  const pieData = useMemo(() => {
    const result = [
      { name: STATUS_LABELS.not_started, value: 0, status: 'not_started' },
      { name: STATUS_LABELS.in_progress, value: 0, status: 'in_progress' },
      { name: STATUS_LABELS.completed, value: 0, status: 'completed' }
    ];

    courses.forEach(course => {
      const p = progress.find(pr => pr.courseId === course.id);
      const status = p?.status || 'not_started';
      if (status === 'not_started') result[0].value++;
      else if (status === 'in_progress') result[1].value++;
      else result[2].value++;
    });

    return result.filter(d => d.value > 0);
  }, [courses, progress]);

  const lineData = useMemo(() => {
    return activity.map(a => ({
      date: a.date.slice(5),
      minutes: a.minutes
    }));
  }, [activity]);

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}小时${mins > 0 ? `${mins}分` : ''}`;
    return `${mins}分钟`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20
      }}>
        <StatCard
          title="总学习时长"
          value={formatHours(stats.totalMinutes)}
          icon="⏱️"
          color="#3B82F6"
        />
        <StatCard
          title="完成课程数"
          value={`${stats.completedCount} / ${courses.length}`}
          icon="✅"
          color="#10B981"
        />
        <StatCard
          title="平均测试分数"
          value={stats.avgScore > 0 ? `${stats.avgScore}分` : '暂无数据'}
          icon="📊"
          color="#F59E0B"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20
      }}>
        <div className="chart-card" style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1E293B' }}>
            课程完成状态分布
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyStyle}>暂无数据</div>
          )}
        </div>

        <div className="chart-card" style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1E293B' }}>
            近7天学习时长
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} unit="分" />
              <Tooltip
                formatter={(value: number) => [`${value}分钟`, '学习时长']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .chart-card {
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
        }
        .chart-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
        }
      `}</style>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  padding: 24,
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
};

const emptyStyle: React.CSSProperties = {
  height: 280,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94A3B8'
};

function StatCard({ title, value, icon, color }: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      className="stat-card"
      style={{
        background: '#FFFFFF',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out'
      }}
    >
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28
      }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, color: '#64748B' }}>{title}</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#1E293B' }}>{value}</span>
      </div>
      <style>{`
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
        }
      `}</style>
    </div>
  );
}
