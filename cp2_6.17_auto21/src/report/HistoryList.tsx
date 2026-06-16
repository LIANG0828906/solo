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
  const { loadFromHistory } = useAnalysisStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
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
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">📚 历史记录</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="刷新"
          >
            🔄
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-16">
            <div className="text-4xl mb-3 animate-spin inline-block">⚙️</div>
            <p>加载中...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg mb-2">暂无历史记录</p>
            <p className="text-sm">分析代码后会自动保存到这里</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-start">
            {history.map(record => {
              const isAnimating = animatingId === record.id;
              const typeStats = getTypeStats(record);
              
              return (
                <div
                  key={record.id}
                  onClick={() => handleRecordClick(record)}
                  className="cursor-pointer transition-all duration-300 hover:scale-[1.02] relative group"
                  style={{
                    width: '280px',
                    borderRadius: '12px',
                    boxShadow: '#00000022 0 4px 12px',
                    backgroundColor: isAnimating ? '#F0F9FF' : 'white',
                    transform: isAnimating ? 'scale(0.98)' : undefined,
                    opacity: isAnimating ? 0.7 : 1,
                  }}
                >
                  <button
                    onClick={(e) => handleDelete(e, record.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 z-10"
                    title="删除记录"
                  >
                    ✕
                  </button>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-medium text-gray-800 truncate text-sm"
                          style={{
                            textDecoration: isAnimating ? 'underline' : 'none',
                            textDecorationColor: '#3B82F6',
                            textDecorationThickness: '2px',
                            transition: 'all 0.5s ease-in-out',
                          }}
                        >
                          📄 {record.filename}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          ⏰ {formatDate(record.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      {typeStats.length > 0 ? (
                        typeStats.map((stat, i) => (
                          <span key={i} className="text-xs">
                            {stat.icon} {stat.count}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-green-600 font-medium">✅ 无问题</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        共 {record.result.stats.total} 个问题
                      </span>
                      <span>
                        {record.code.split('\n').length} 行
                      </span>
                    </div>
                  </div>

                  <div 
                    className="h-1 rounded-b-xl"
                    style={{
                      background: `linear-gradient(to right, 
                        ${record.result.stats.duplication > 0 ? '#FFE0E0' : 'transparent'} 0%,
                        ${record.result.stats.duplication > 0 ? '#FFE0E0' : 'transparent'} 33%,
                        ${record.result.stats.complexity > 0 ? '#FFF0D0' : 'transparent'} 33%,
                        ${record.result.stats.complexity > 0 ? '#FFF0D0' : 'transparent'} 66%,
                        ${record.result.stats.longFunction > 0 ? '#E0F0FF' : 'transparent'} 66%,
                        ${record.result.stats.longFunction > 0 ? '#E0F0FF' : 'transparent'} 100%
                      )`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-white border-t border-gray-200 text-center text-xs text-gray-400">
        最多保存 100 条记录
      </div>
    </div>
  );
}
