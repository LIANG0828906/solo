import React from 'react';
import { HistoryRecord } from './types';

interface HistoryPanelProps {
  records: HistoryRecord[];
  onSelect: (record: HistoryRecord) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ records, onSelect }) => {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${mo}-${da}`;
  };

  const getDominantName = (record: HistoryRecord) => {
    const sorted = [...record.emotions].sort((a, b) => b.intensity - a.intensity);
    return sorted[0]?.name || '';
  };

  return (
    <div
      style={{
        background: '#1A1A22',
        borderRadius: '16px',
        padding: '16px',
        height: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          color: '#E0E0E8',
          fontSize: '14px',
          fontWeight: 500,
          opacity: 0.8,
          flexShrink: 0,
        }}
      >
        历史记录
      </div>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          overflowY: 'hidden',
          flex: 1,
          paddingBottom: '4px',
          scrollbarWidth: 'thin',
        }}
        className="history-scroll"
      >
        {records.length === 0 && (
          <div
            style={{
              color: '#888',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            还没有历史记录，输入一段心情试试吧～
          </div>
        )}
        {records.map((record) => (
          <div
            key={record.id}
            onClick={() => onSelect(record)}
            style={{
              width: '140px',
              height: '160px',
              minWidth: '140px',
              background: '#1E1E28',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3A3A4A';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                color: '#888',
                fontSize: '12px',
                width: '100%',
                textAlign: 'left',
              }}
            >
              {formatDate(record.timestamp)} {formatTime(record.timestamp)}
            </div>
            <div
              style={{
                width: '60px',
                height: '60px',
                clipPath:
                  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: '#111118',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {record.thumbnailData && (
                <img
                  src={record.thumbnailData}
                  alt="thumbnail"
                  style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                />
              )}
            </div>
            <div
              style={{
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              {getDominantName(record)}
            </div>
            <div
              style={{
                color: '#888',
                fontSize: '11px',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                width: '100%',
              }}
            >
              {record.inputText}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .history-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .history-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .history-scroll::-webkit-scrollbar-thumb {
          background: #3A3A4A;
          border-radius: 2px;
        }
        @media (max-width: 768px) {
          .history-scroll {
            flex-direction: column !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HistoryPanel;
