import React, { useState } from 'react';
import type { HistoryItem } from './utils/types';
import { getContrastColor } from './utils/colorUtils';
import { History, ChevronRight, X } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onRestore, onClear }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={`history-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <History size={18} />
        {!isOpen && history.length > 0 && (
          <span className="history-badge">{history.length}</span>
        )}
      </button>

      <div className={`history-panel ${isOpen ? 'open' : ''}`}>
        <style>{`
          .history-toggle {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(22, 33, 62, 0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-right: none;
            color: var(--text-primary);
            padding: 12px 10px;
            border-radius: 8px 0 0 8px;
            cursor: pointer;
            z-index: 999;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            transition: all var(--transition-normal);
            box-shadow: -4px 0 16px rgba(0,0,0,0.2);
          }
          .history-toggle:hover {
            background: rgba(22, 33, 62, 1);
            padding-right: 14px;
          }
          .history-toggle.open {
            right: 280px;
          }
          .history-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: var(--text-primary);
            color: var(--bg-primary);
            font-size: 10px;
            font-weight: 700;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .history-panel {
            position: fixed;
            right: -280px;
            top: 0;
            width: 280px;
            height: 100vh;
            background: rgba(22, 33, 62, 0.85);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-left: 1px solid rgba(255,255,255,0.1);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            transition: right var(--transition-normal);
            box-shadow: -4px 0 30px rgba(0,0,0,0.3);
          }
          .history-panel.open {
            right: 0;
          }
          .history-header {
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .history-header-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary);
          }
          .history-close {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            transition: all var(--transition-fast);
          }
          .history-close:hover {
            color: var(--text-primary);
            background: rgba(255,255,255,0.05);
          }
          .history-list {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .history-item {
            padding: 12px;
            background: rgba(255,255,255,0.03);
            border-radius: 10px;
            cursor: pointer;
            transition: all var(--transition-normal);
            border: 1px solid transparent;
            animation: bounce-in 0.3s ease;
          }
          .history-item:hover {
            background: rgba(255,255,255,0.06);
            transform: translateX(-4px);
            border-color: rgba(255,255,255,0.1);
          }
          .history-item-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .history-dot {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            flex-shrink: 0;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
          .history-info {
            flex: 1;
            min-width: 0;
          }
          .history-palette-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .history-time {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 2px;
          }
          .history-arrow {
            color: var(--text-secondary);
            opacity: 0;
            transition: all var(--transition-fast);
          }
          .history-item:hover .history-arrow {
            opacity: 1;
            transform: translateX(-2px);
          }
          .history-expanded {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255,255,255,0.06);
            display: flex;
            gap: 6px;
            animation: fadeIn 0.2s ease;
          }
          .history-swatch {
            flex: 1;
            height: 28px;
            border-radius: 5px;
            cursor: pointer;
            transition: all var(--transition-fast);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .history-swatch:hover {
            transform: scaleY(1.15);
          }
          .history-swatch-text {
            font-size: 9px;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            opacity: 0;
            transition: opacity var(--transition-fast);
            letter-spacing: 0.5px;
          }
          .history-swatch:hover .history-swatch-text {
            opacity: 1;
          }
          .history-empty {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            font-size: 13px;
            gap: 8px;
            padding: 20px;
            text-align: center;
          }
          .history-footer {
            padding: 12px 16px;
            border-top: 1px solid rgba(255,255,255,0.08);
          }
          .history-clear-btn {
            width: 100%;
            padding: 8px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            color: var(--text-secondary);
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all var(--transition-fast);
          }
          .history-clear-btn:hover {
            background: rgba(255,100,100,0.15);
            color: #ff7070;
            border-color: rgba(255,100,100,0.2);
          }
        `}</style>
        <div className="history-header">
          <div className="history-header-title">
            <History size={16} />
            <span>历史记录</span>
          </div>
          <button className="history-close" onClick={() => setIsOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="history-empty">
            <History size={32} style={{ opacity: 0.3 }} />
            <span>暂无历史记录<br />选择配色方案后将自动保存</span>
          </div>
        ) : (
          <>
            <div className="history-list">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="history-item"
                  onClick={() => onRestore(item)}
                  onMouseEnter={() => setExpandedId(item.id)}
                  onMouseLeave={() => setExpandedId(null)}
                >
                  <div className="history-item-row">
                    <div className="history-dot" style={{ background: item.primaryColor }} />
                    <div className="history-info">
                      <div className="history-palette-name">{item.palette.name}</div>
                      <div className="history-time">
                        {new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <ChevronRight size={14} className="history-arrow" />
                  </div>
                  {expandedId === item.id && (
                    <div className="history-expanded">
                      {item.palette.colors.map((c, i) => (
                        <div
                          key={i}
                          className="history-swatch"
                          style={{ background: c }}
                          title={c}
                        >
                          <span
                            className="history-swatch-text"
                            style={{ color: getContrastColor(c) }}
                          >
                            {c.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="history-footer">
              <button className="history-clear-btn" onClick={onClear}>
                清空历史记录
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default React.memo(HistoryPanel);
