import { useState, useEffect } from 'react';
import { useAnalysisStore } from '../analysis/store';
import { loadAllHistory, deleteFromDB } from '../utils/db';
import type { HistoryRecord } from '../utils/db';

interface HistoryListProps {
  onClose: () => void;
}

export default function HistoryList({ onClose }: HistoryListProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const { loadFromHistory, selectIssue } = useAnalysisStore();

  useEffect(() => {
    loadHistoryRecords();
  }, []);

  const loadHistoryRecords = async () => {
    try {
      setLoading(true);
      const records = await loadAllHistory();
      setHistory(records);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordClick = (record: HistoryRecord) => {
    setAnimatingId(record.id);

    setTimeout(() => {
      loadFromHistory(record);

      if (record.result.issues.length > 0) {
        const firstIssue = record.result.issues[0];
        selectIssue(firstIssue.id);
      }

      setAnimatingId(null);
      onClose();
    }, 500);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteFromDB('history', id);
      setHistory(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Failed to delete record:', e);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeStats = (record: HistoryRecord) => {
    const { stats } = record.result;
    return [
      stats.duplication > 0 && { icon: '🔴', count: stats.duplication },
      stats.complexity > 0 && { icon: '🟡', count: stats.complexity },
      stats.longFunction > 0 && { icon: '🔵', count: stats.longFunction },
    ].filter(Boolean) as { icon: string; count: number }[];
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}>📚 历史记录</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadHistoryRecords}
            style={{
              padding: '8px',
              color: '#6b7280',
              borderRadius: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
            title="刷新"
          >
            🔄
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              color: '#6b7280',
              borderRadius: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
            title="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '64px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px', display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</div>
            <p>加载中...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '64px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>暂无历史记录</p>
            <p style={{ fontSize: '14px' }}>分析代码后会自动保存到这里</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
            {history.map(record => {
              const isAnimating = animatingId === record.id;
              const typeStats = getTypeStats(record);

              return (
                <div
                  key={record.id}
                  onClick={() => handleRecordClick(record)}
                  style={{
                    width: '280px',
                    borderRadius: '12px',
                    boxShadow: '#00000022 0 4px 12px',
                    backgroundColor: isAnimating ? '#EFF6FF' : 'white',
                    transform: isAnimating ? 'scale(0.97)' : undefined,
                    opacity: isAnimating ? 0.7 : 1,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease, transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnimating) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '#00000033 0 8px 24px';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAnimating) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '#00000022 0 4px 12px';
                    }
                  }}
                >
                  <button
                    onClick={(e) => handleDelete(e, record.id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      opacity: 0,
                      width: '24px',
                      height: '24px',
                      borderRadius: '9999px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.15s ease',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = '#dc2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.backgroundColor = '#ef4444'; }}
                    title="删除记录"
                  >
                    ✕
                  </button>

                  <div style={{
                    padding: '16px',
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <h3 style={{
                        fontWeight: 500,
                        color: '#1a1a2e',
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: isAnimating ? 'underline' : 'none',
                        textDecorationColor: '#3B82F6',
                        textDecorationThickness: '2px',
                        transition: 'all 0.5s ease-in-out',
                      }}>
                        📄 {record.filename}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                        ⏰ {formatDate(record.createdAt)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                      {typeStats.length > 0 ? (
                        typeStats.map((stat, i) => (
                          <span key={i} style={{ fontSize: '12px' }}>
                            {stat.icon} {stat.count}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>✅ 无问题</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                      <span>共 {record.result.stats.total} 个问题</span>
                      <span>{record.code.split('\n').length} 行</span>
                    </div>
                  </div>

                  <div style={{
                    height: '4px',
                    borderRadius: '0 0 12px 12px',
                    background: `linear-gradient(to right, 
                      ${record.result.stats.duplication > 0 ? '#FFE0E0' : 'transparent'} 0%,
                      ${record.result.stats.duplication > 0 ? '#FFE0E0' : 'transparent'} 33%,
                      ${record.result.stats.complexity > 0 ? '#FFF0D0' : 'transparent'} 33%,
                      ${record.result.stats.complexity > 0 ? '#FFF0D0' : 'transparent'} 66%,
                      ${record.result.stats.longFunction > 0 ? '#E0F0FF' : 'transparent'} 66%,
                      ${record.result.stats.longFunction > 0 ? '#E0F0FF' : 'transparent'} 100%
                    )`,
                  }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        fontSize: '12px',
        color: '#9ca3af',
      }}>
        最多保存 100 条记录
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
