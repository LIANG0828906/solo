import React from 'react';
import { Clock, X, FileText } from 'lucide-react';
import { useDocStore, HistoryItem } from '@/store/docStore';

/**
 * 历史回溯面板
 * 数据流向：
 *   - 从 store 读取 history（已按时间倒序排列，最多20条）
 *   - 调用 store.jumpToHistory() 跳转到对应阅读位置
 *   - 面板宽度 260px，背景色 #f1f5f9
 *
 * 格式化要求：
 *   - 使用 Intl.DateTimeFormat 格式化日期时间
 *   - 显示格式："日期 时间 - 文档标题/位置摘要"
 *   - 按时间倒序排列（最新记录在最前）
 */

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  second: undefined,
  hour12: false,
});

const formatDateTime = (timestamp: number): string => {
  const dateStr = dateFormatter.format(timestamp);
  const timeStr = timeFormatter.format(timestamp);
  return `${dateStr} ${timeStr}`;
};

const HistoryPanel: React.FC = () => {
  const { history, showHistoryPanel, toggleHistoryPanel, jumpToHistory } =
    useDocStore();

  const sortedHistory = [...history].sort(
    (a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp
  );

  return (
    <>
      {showHistoryPanel && (
        <div
          className="anim-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 90,
          }}
          onClick={toggleHistoryPanel}
        />
      )}

      <aside
        className="history-panel anim-slide-in-bottom"
        style={{
          position: 'fixed',
          top: 60,
          right: showHistoryPanel ? 0 : -280,
          width: 260,
          backgroundColor: '#f1f5f9',
          height: 'calc(100% - 60px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'right 0.3s ease',
          boxShadow: showHistoryPanel ? '-2px 0 12px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Clock size={18} color="#3b82f6" />
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              color: '#1e293b',
              flex: 1,
            }}
          >
            阅读历史
          </h3>
          <button
            onClick={toggleHistoryPanel}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: '#64748b',
            }}
            aria-label="关闭历史面板"
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {sortedHistory.length === 0 ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: 13,
              }}
            >
              暂无阅读记录
            </div>
          ) : (
            sortedHistory.map((item: HistoryItem) => (
              <button
                key={item.id}
                onClick={() => jumpToHistory(item.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  marginBottom: 4,
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    '#3b82f6';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 2px 8px rgba(59, 130, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    '#e2e8f0';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    'none';
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748b',
                    marginBottom: 4,
                    fontFamily: 'monospace',
                  }}
                >
                  {formatDateTime(item.timestamp)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                  }}
                >
                  <FileText size={12} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{item.docTitle}</span>
                    <span style={{ color: '#94a3b8', margin: '0 4px' }}>/</span>
                    <span style={{ color: '#64748b' }}>{item.summary}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #e2e8f0',
            fontSize: 11,
            color: '#94a3b8',
            textAlign: 'center',
          }}
        >
          最多保留 20 条记录
        </div>
      </aside>
    </>
  );
};

export default HistoryPanel;
