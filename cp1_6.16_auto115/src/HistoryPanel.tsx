import React, { useState, useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import type { HistoryRecord } from './store/useAppStore';

export default function HistoryPanel() {
  const { history, restoreHistory, removeHistory, setIsBreathing } = useAppStore();
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const handleClick = (record: HistoryRecord) => {
    if (longPressId) {
      setLongPressId(null);
      return;
    }
    if (deleteConfirmId === record.id) {
      setDeleteConfirmId(null);
      return;
    }
    restoreHistory(record);
    setIsBreathing(true);
    setTimeout(() => setIsBreathing(false), 4000);
  };

  const handleMouseDown = (id: string) => {
    setDeleteConfirmId(null);
    longPressTimerRef.current = setTimeout(() => {
      setLongPressId(id);
      setDeleteConfirmId(id);
    }, 600);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeHistory(id);
    setDeleteConfirmId(null);
    setLongPressId(null);
  };

  return (
    <div
      className="history-panel"
      style={{
        width: '100%',
        maxWidth: '800px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 4px 16px rgba(139,90,43,0.12)',
        fontFamily: 'serif',
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          color: '#8B4513',
          margin: '0 0 12px 0',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>历史记录</span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '400',
            color: 'rgba(139,69,19,0.6)',
          }}
        >
          {history.length}/15 长按删除
        </span>
      </h3>

      {history.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '30px',
            color: 'rgba(139,69,19,0.4)',
            fontSize: '14px',
          }}
        >
          暂无历史记录，应用配色方案后将自动保存
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(139,69,19,0.2) transparent',
          }}
        >
          {history.map((record, index) => (
            <div
              key={record.id}
              onClick={() => handleClick(record)}
              onMouseDown={() => handleMouseDown(record.id)}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                handleMouseUp();
              }}
              onTouchStart={() => handleMouseDown(record.id)}
              onTouchEnd={handleMouseUp}
              style={{
                position: 'relative',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: longPressId === record.id ? 'scale(0.95)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (deleteConfirmId !== record.id) {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={(e) => {
                if (deleteConfirmId !== record.id) {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(139,90,43,0.15)',
                  border: deleteConfirmId === record.id
                    ? '2px solid #C41E3A'
                    : '1px solid rgba(139,69,19,0.1)',
                  background: '#F5F0E8',
                  transition: 'all 0.3s ease',
                }}
              >
                <img
                  src={record.thumbnail}
                  alt={`配色 ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(139,69,19,0.7)',
                  textAlign: 'center',
                  marginTop: '6px',
                }}
              >
                {record.scheme.name}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'rgba(139,69,19,0.5)',
                  textAlign: 'center',
                }}
              >
                {formatTime(record.timestamp)}
              </div>

              {deleteConfirmId === record.id && (
                <button
                  onClick={(e) => handleDelete(record.id, e)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#C41E3A',
                    color: 'white',
                    border: '2px solid white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(196,30,58,0.4)',
                    animation: 'deleteBtnIn 0.2s ease-out',
                    padding: '0',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .history-panel::-webkit-scrollbar {
          height: 6px;
        }
        .history-panel::-webkit-scrollbar-track {
          background: rgba(139,69,19,0.05);
          border-radius: 3px;
        }
        .history-panel::-webkit-scrollbar-thumb {
          background: rgba(139,69,19,0.2);
          border-radius: 3px;
        }
        .history-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(139,69,19,0.3);
        }
        @keyframes deleteBtnIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
