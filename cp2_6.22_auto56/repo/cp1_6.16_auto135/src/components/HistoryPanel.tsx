import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useGeneStore } from '@/store/useGeneStore';
import { HistorySnapshot } from '@/models/GeneticElement';

const ITEM_HEIGHT = 56;
const VISIBLE_COUNT = 5;

export const HistoryPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const history = useGeneStore((s) => s.history);
  const restoreSnapshot = useGeneStore((s) => s.restoreSnapshot);
  const clearHistory = useGeneStore((s) => s.clearHistory);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 1);
    const endIndex = Math.min(history.length, startIndex + VISIBLE_COUNT + 2);
    return history.slice(startIndex, endIndex).map((item, idx) => ({
      ...item,
      virtualIndex: startIndex + idx
    }));
  }, [history, scrollTop]);

  const totalHeight = history.length * ITEM_HEIGHT;

  return (
    <div className={`history-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div
        className="history-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="history-title">
          <Clock size={18} />
          <span>历史记录</span>
          <span className="history-count">({history.length})</span>
        </div>
        <div className="history-actions">
          {history.length > 0 && (
            <button
              className="clear-button"
              onClick={(e) => {
                e.stopPropagation();
                clearHistory();
              }}
              title="清空记录"
            >
              <Trash2 size={14} />
            </button>
          )}
          {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div
          className="history-list"
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ maxHeight: 250 - 40 }}
        >
          {history.length === 0 ? (
            <div className="history-empty">
              暂无历史记录，运行模拟后会自动保存快照
            </div>
          ) : (
            <div style={{ height: totalHeight, position: 'relative' }}>
              {visibleItems.map((item: HistorySnapshot & { virtualIndex: number }) => (
                <div
                  key={item.id}
                  className="history-item"
                  style={{
                    position: 'absolute',
                    top: item.virtualIndex * ITEM_HEIGHT,
                    left: 0,
                    right: 0,
                    height: ITEM_HEIGHT
                  }}
                  onClick={() => restoreSnapshot(item.id)}
                >
                  <div className="history-item-icon">
                    {item.result?.success ? (
                      <CheckCircle size={18} className="success" />
                    ) : item.result ? (
                      <XCircle size={18} className="failure" />
                    ) : (
                      <Clock size={18} className="neutral" />
                    )}
                  </div>
                  <div className="history-item-content">
                    <div className="history-item-date">
                      {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                    </div>
                    <div className="history-item-desc">
                      {item.result
                        ? item.result.message
                        : `${item.elements.length} 个元件, ${item.connections.length} 条连接`}
                    </div>
                  </div>
                  <div className="history-item-counts">
                    <span className="badge badge-elements">{item.elements.length}</span>
                    <span className="badge badge-connections">{item.connections.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
