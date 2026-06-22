import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { LoadingSpinner } from '../components/Common';
import { Assignment } from '../../types';

const StatsCharts = lazy(() => import('../components/StatsCharts'));

export const StatsPage: React.FC<{ initialAssignmentId?: string }> = ({ initialAssignmentId }) => {
  const { assignments, fetchAssignments, stats, fetchStats, loading, error, setError } = useAppStore();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (initialAssignmentId && assignments.length > 0) {
      const a = assignments.find((x) => x.id === initialAssignmentId);
      if (a) {
        setSelectedAssignment(a);
        fetchStats(a.id);
      }
    }
  }, [initialAssignmentId, assignments, fetchStats]);

  const handleSelect = async (a: Assignment) => {
    setSelectedAssignment(a);
    await fetchStats(a.id);
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleString('zh-CN');

  if (!selectedAssignment) {
    return (
      <div>
        <h2 className="page-title">选择作业查看统计</h2>
        {loading && assignments.length === 0 ? (
          <LoadingSpinner />
        ) : assignments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#9e9e9e', padding: '40px' }}>
            暂无作业
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelect(a)}
            >
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#37474f', marginBottom: '6px' }}>
                {a.title}
              </h4>
              <p style={{ fontSize: '13px', color: '#607d8b' }}>
                {a.description?.slice(0, 100) || '暂无描述'}
              </p>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn-secondary"
          onClick={() => setSelectedAssignment(null)}
          style={{ marginBottom: '12px' }}
        >
          ← 返回作业列表
        </button>
        <h2 className="page-title" style={{ marginBottom: '4px' }}>统计面板</h2>
        <div style={{ color: '#607d8b', fontSize: '14px' }}>{selectedAssignment.title}</div>
      </div>

      {error && (
        <div className="card" style={{ background: '#ffebee', color: '#c62828', marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {loading || !stats ? (
        <LoadingSpinner />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="card">
              <div style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>提交总人数</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#1976d2' }}>{stats.totalSubmissions}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>平均测试通过率</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#4caf50' }}>
                  {Math.round(stats.averagePassRate * 100)}%
                </div>
              </div>
              <div style={{
                marginTop: '10px', height: '8px', borderRadius: '4px',
                background: '#e0e0e0', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${stats.averagePassRate * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #81c784, #4caf50)',
                  borderRadius: '4px',
                }} />
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>平均互评评分</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#ff9800' }}>
                  {stats.averageScore.toFixed(1)}
                </div>
                <span style={{ fontSize: '20px', color: '#ffc107' }}>★</span>
              </div>
              <div style={{
                marginTop: '10px', height: '8px', borderRadius: '4px',
                background: '#e0e0e0', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(stats.averageScore / 5) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ffd54f, #ffb300)',
                  borderRadius: '4px',
                }} />
              </div>
            </div>
          </div>

          <Suspense fallback={<LoadingSpinner />}>
            <StatsCharts
              hourlyDistribution={stats.hourlyDistribution}
              averagePassRate={stats.averagePassRate}
              averageScore={stats.averageScore}
            />
          </Suspense>

          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#455a64', marginBottom: '16px' }}>
              📋 学生提交列表
            </h4>
            {stats.submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9e9e9e', fontSize: '13px' }}>
                暂无提交
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ textAlign: 'left', padding: '10px 8px', color: '#607d8b', fontWeight: 600 }}>学生</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', color: '#607d8b', fontWeight: 600 }}>提交时间</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', color: '#607d8b', fontWeight: 600 }}>测试通过</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', color: '#607d8b', fontWeight: 600 }}>平均评分</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', color: '#607d8b', fontWeight: 600 }}>评价数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.submissions.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 500 }}>{s.studentName}</td>
                        <td style={{ padding: '10px 8px', color: '#757575', fontSize: '12px' }}>{formatTime(s.submittedAt)}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{
                            color: s.passedCount === s.totalCount ? '#4caf50' : '#ff9800',
                            fontWeight: 600,
                          }}>
                            {s.passedCount}/{s.totalCount}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          {s.reviews.length > 0 ? (
                            <span style={{ color: '#ff9800', fontWeight: 600 }}>
                              {s.averageReviewScore.toFixed(1)} ★
                            </span>
                          ) : (
                            <span style={{ color: '#bdbdbd' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#757575' }}>{s.reviews.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
