import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { fetchUserRecords } from '../modules/community/CommunityController';
import { fetchUserStats, getExtractionAdvice, UserStats } from '../modules/stats/StatsService';
import { BrewingRecord } from '../modules/brewing/BrewingService';

const FLAVOR_COLORS = ['#E74C3C', '#F39C12', '#6B4423', '#34495E', '#3498DB', '#9B59B6'];

const ProfilePage: React.FC = () => {
  const { setIsLoading } = useAppStore();
  const [records, setRecords] = useState<BrewingRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [recordsResult, statsResult] = await Promise.all([
          fetchUserRecords('user1', 1, 100),
          fetchUserStats('user1', 30),
        ]);
        setRecords(recordsResult.records);
        setStats(statsResult);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [setIsLoading]);

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return (
    <div className="profile-page">
      <div className="page-header profile-header">
        <div className="page-icon">👤</div>
        <div>
          <h1 className="page-title">个人中心</h1>
          <p className="page-subtitle">冲煮历史与数据统计</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="stats-section">
          <h2 className="section-title">近30天统计</h2>

          <div className="stats-summary">
            <div className="stat-card">
              <span className="stat-label">冲煮次数</span>
              <span className="stat-value">{stats?.totalRecords || 0}</span>
              <span className="stat-unit">次</span>
            </div>
            <div className="stat-card highlight">
              <span className="stat-label">平均萃取率</span>
              <span className="stat-value">{stats?.avgExtraction?.toFixed(2) || '0.00'}</span>
              <span className="stat-unit">%</span>
              {stats && (
                <span className="stat-hint">{getExtractionAdvice(stats.avgExtraction)}</span>
              )}
            </div>
            <div className="stat-card">
              <span className="stat-label">浅/中/深</span>
              <span className="stat-value roast-values">
                <span className="roast-count light">{stats?.roastCount?.['浅'] || 0}</span>
                <span className="roast-divider">/</span>
                <span className="roast-count medium">{stats?.roastCount?.['中'] || 0}</span>
                <span className="roast-divider">/</span>
                <span className="roast-count dark">{stats?.roastCount?.['深'] || 0}</span>
              </span>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">萃取率趋势</h3>
              <div className="chart-container" style={{ background: '#F2ECE4', width: '100%', maxWidth: 400, margin: '0 auto' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={stats?.extractionTrend || []} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0D5C1" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#4A3728', fontFamily: 'Noto Sans SC' }}
                      tickFormatter={(v) => v?.slice(5) || ''}
                      axisLine={{ stroke: '#D5B48C' }}
                      tickLine={{ stroke: '#D5B48C' }}
                    />
                    <YAxis
                      domain={[14, 26]}
                      tick={{ fontSize: 11, fill: '#4A3728' }}
                      axisLine={{ stroke: '#D5B48C' }}
                      tickLine={{ stroke: '#D5B48C' }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FDFCF8',
                        border: '1px solid #D5B48C',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(val: number) => [`${val.toFixed(2)}%`, '萃取率']}
                    />
                    <Line
                      type="monotone"
                      dataKey="萃取率"
                      stroke="#C0392B"
                      strokeWidth={2.5}
                      dot={{ fill: '#C0392B', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-title">风味分布</h3>
              <div className="chart-container" style={{ background: '#F2ECE4', width: '100%', maxWidth: 400, margin: '0 auto' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats?.flavorDist || []} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0D5C1" vertical={false} />
                    <XAxis
                      dataKey="flavor"
                      tick={{ fontSize: 12, fill: '#4A3728', fontFamily: 'Noto Sans SC' }}
                      axisLine={{ stroke: '#D5B48C' }}
                      tickLine={{ stroke: '#D5B48C' }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 11, fill: '#4A3728' }}
                      axisLine={{ stroke: '#D5B48C' }}
                      tickLine={{ stroke: '#D5B48C' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FDFCF8',
                        border: '1px solid #D5B48C',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(val: number) => [val.toFixed(2), '平均分']}
                    />
                    <Bar dataKey="平均" radius={[6, 6, 0, 0]} barSize={36}>
                      {(stats?.flavorDist || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={FLAVOR_COLORS[index % FLAVOR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="history-section">
          <h2 className="section-title">冲煮历史</h2>
          <div className="history-list">
            {sortedRecords.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">📝</div>
                <div>还没有冲煮记录，去记录第一次吧！</div>
              </div>
            ) : (
              sortedRecords.map(r => (
                <div key={r.id} className="history-item">
                  <div className="history-date">
                    {r.createdAt?.split('T')[0] || '未知日期'}
                  </div>
                  <div className="history-main">
                    <div className="history-bean">
                      <span className="history-origin-tag">{r.origin}</span>
                      <span className="history-name" title={r.beanName}>{r.beanName}</span>
                      <span className="history-roast">{r.roastLevel}焙</span>
                    </div>
                    <div className="history-params">
                      研磨{r.grindSize} · {r.waterTemp}°C · {r.ratio}
                    </div>
                  </div>
                  <div className={`history-extraction ${r.extractionRate >= 18 && r.extractionRate <= 22 ? 'ideal' : ''}`}>
                    <span className="history-ext-label">萃取率</span>
                    <span className="history-ext-value">{r.extractionRate.toFixed(2)}%</span>
                  </div>
                  <div className="history-status">
                    {r.isPublished && <span className="published-badge">已发布</span>}
                    {r.likes ? <span className="history-likes">❤ {r.likes}</span> : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
