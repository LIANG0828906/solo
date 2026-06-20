import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { OperationRecord } from '@/types';
import { formatHistoryTime } from '@/utils/time';

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  history: OperationRecord[];
}

const actionMap: Record<OperationRecord['action'], string> = {
  add: '添加',
  update: '更新',
  delete: '删除',
  reorder: '重新排序',
};

const actionColorMap: Record<OperationRecord['action'], string> = {
  add: '#10b981',
  update: '#3b82f6',
  delete: '#ef4444',
  reorder: '#f59e0b',
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ open, onClose, history }) => {
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    if (panelRef.current) {
      const diff = touchCurrentX.current - touchStartX.current;
      if (diff > 0) {
        panelRef.current.style.transform = `translateX(${diff}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    const diff = touchCurrentX.current - touchStartX.current;
    if (panelRef.current) {
      if (diff > 50) {
        panelRef.current.style.transform = 'translateX(100%)';
        setTimeout(onClose, 200);
      } else {
        panelRef.current.style.transform = 'translateX(0)';
      }
    }
    touchStartX.current = 0;
    touchCurrentX.current = 0;
  };

  useEffect(() => {
    if (panelRef.current) {
      if (open) {
        panelRef.current.style.transform = 'translateX(0)';
      } else {
        panelRef.current.style.transform = 'translateX(100%)';
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
      />
      <div
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 320,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'transform 300ms ease-out',
          transform: 'translateX(100%)',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #e2e8f0',
            position: 'relative',
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#1e293b',
              margin: 0,
            }}
          >
            操作历史
          </h3>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 80px)',
            padding: '12px 16px',
          }}
        >
          {history.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 200,
                color: '#94a3b8',
                fontSize: 14,
              }}
            >
              暂无操作记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((record) => (
                <div
                  key={record.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: '#f8fafc',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f8fafc';
                  }}
                >
                  <img
                    src={record.operatorAvatar}
                    alt={record.operatorName}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      backgroundColor: '#e2e8f0',
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='18' fill='%23e2e8f0'/%3E%3Ctext x='18' y='23' text-anchor='middle' font-size='16' fill='%2364748b' font-family='Arial'%3E${encodeURIComponent(record.operatorName.charAt(0))}%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: '#334155',
                        wordBreak: 'break-word',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{record.operatorName}</span>{' '}
                      <span style={{ color: actionColorMap[record.action], fontWeight: 500 }}>
                        {actionMap[record.action]}
                      </span>{' '}
                      了"{record.eventTitle}"
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#94a3b8',
                        marginTop: 4,
                      }}
                    >
                      {formatHistoryTime(record.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
