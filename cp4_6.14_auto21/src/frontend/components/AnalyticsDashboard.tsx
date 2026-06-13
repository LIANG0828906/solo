import { useState, useEffect } from 'react';
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
  Legend,
} from 'recharts';
import { analyticsApi } from '../api';
import { AnalyticsStats, TimeSlotStat } from '../types';

const COLORS = ['#4f8cf7', '#6aafff', '#2ed573', '#ffa502', '#ff6b7a', '#8b5cf6'];

const completionData = [
  { name: '已完成', value: 0, color: '#2ed573' },
  { name: '进行中', value: 0, color: '#4f8cf7' },
  { name: '未开始', value: 0, color: '#ffa502' },
];

function AnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalCourses: 0,
    totalLearners: 0,
    averageScore: 0,
    completionRate: 0,
  });
  const [timeSlotData, setTimeSlotData] = useState<TimeSlotStat[]>([]);
  const [pieData, setPieData] = useState(completionData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.getStats(), analyticsApi.getTimeSlotStats()])
      .then(([statsData, timeSlots]) => {
        setStats(statsData);
        setTimeSlotData(timeSlots);

        const completed = Math.floor((statsData.completionRate / 100) * statsData.totalCourses);
        const inProgress = Math.floor(statsData.totalCourses * 0.4);
        const notStarted = statsData.totalCourses - completed - inProgress;

        setPieData([
          { name: '已完成', value: completed, color: '#2ed573' },
          { name: '进行中', value: inProgress, color: '#4f8cf7' },
          { name: '未开始', value: notStarted, color: '#ffa502' },
        ]);

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">数据分析</h1>
          <p className="page-description">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数据分析</h1>
        <p className="page-description">培训数据概览与趋势分析</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value">{stats.totalCourses}</div>
          <div className="stat-card-label">课程总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.totalLearners}</div>
          <div className="stat-card-label">学员总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.averageScore}分</div>
          <div className="stat-card-label">平均考核分数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.completionRate}%</div>
          <div className="stat-card-label">学员完成率</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">最受欢迎的课程时段</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSlotData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="slot" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${value} 门课程`, '课程数']}
                />
                <Bar dataKey="count" fill="#4f8cf7" radius={[4, 4, 0, 0]}>
                  {timeSlotData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? 'url(#colorGradient)' : '#e8edf3'}
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f8cf7" />
                    <stop offset="100%" stopColor="#6aafff" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">课程完成率分布</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} 门`, '课程数']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="chart-title">各时段课程数量详情</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSlotData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis
                  dataKey="slot"
                  type="category"
                  tick={{ fontSize: 12, fill: '#888' }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${value} 门`, '课程数量']}
                />
                <Bar dataKey="count" fill="#6aafff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
