import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import type { Activity, LotteryResult } from '@/types';

export default function ResultPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      const data = await api.getActivities();
      setActivities(data);
      if (data.length > 0 && !selectedActivityId) {
        setSelectedActivityId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载活动列表失败');
    }
  }, [selectedActivityId]);

  const loadResults = useCallback(async () => {
    if (!selectedActivityId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.getResults(selectedActivityId);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载结果失败');
    } finally {
      setLoading(false);
    }
  }, [selectedActivityId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    if (selectedActivityId) {
      loadResults();
    }
  }, [selectedActivityId, loadResults]);

  const handleExport = () => {
    if (selectedActivityId) {
      api.exportResults(selectedActivityId);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div>
      <h1 className="page-title">历史中奖结果</h1>

      <div className="card">
        <div className="filter-section">
          <div className="activity-selector">
            <label style={{ fontSize: 14, fontWeight: 600 }}>选择活动：</label>
            <select
              className="activity-select"
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
            >
              <option value="">-- 请选择活动 --</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </div>

          {selectedActivityId && (
            <button className="btn btn-outline" onClick={handleExport}>
              📥 导出CSV
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: 12, background: '#FFE8E8', color: '#DC3545', borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">加载中...</div>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">
              {selectedActivityId ? '该活动暂无中奖记录' : '请先选择一个活动'}
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
              共 {results.length} 条中奖记录
            </div>
            <table className="results-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>序号</th>
                  <th style={{ width: 100 }}>奖品</th>
                  <th>奖品名称</th>
                  <th>中奖人</th>
                  <th>开奖时间</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={result.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontSize: 28, textAlign: 'center' }}>{result.prizeIcon}</td>
                    <td style={{ fontWeight: 600 }}>{result.prizeName}</td>
                    <td style={{ color: 'var(--primary-purple)', fontWeight: 600 }}>
                      🏆 {result.participantName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {formatTime(result.drawnAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
