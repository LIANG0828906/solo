import React from 'react';
import { useStore, HistoryRecord } from '../store';

const HistoryList: React.FC = () => {
  const history = useStore((s) => s.history);
  const deleteHistoryItem = useStore((s) => s.deleteHistoryItem);
  const clearHistory = useStore((s) => s.clearHistory);

  return (
    <div
      style={{
        width: '240px',
        minWidth: '240px',
        background: '#F0F0F0',
        padding: '20px 16px',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '16px', fontWeight: 700 }}>
          历史记录
        </h3>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              border: 'none',
              background: 'none',
              color: '#E74C3C',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(231,76,60,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            清空全部
          </button>
        )}
      </div>

      {history.length === 0 && (
        <div style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          暂无记录
        </div>
      )}

      {history.map((record: HistoryRecord) => (
        <div
          key={record.id}
          style={{
            width: '200px',
            borderRadius: '8px',
            background: '#FFFFFF',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            cursor: 'default',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
          }}
        >
          <img
            src={record.thumbnail}
            alt="缩略图"
            style={{
              width: '80px',
              height: '60px',
              objectFit: 'cover',
              display: 'block',
              margin: '8px auto 0',
              borderRadius: '4px',
            }}
          />
          <div style={{ padding: '8px 12px 10px' }}>
            <div
              style={{
                fontFamily: '"SimHei", "Microsoft YaHei", "Heiti SC", sans-serif',
                fontSize: '16px',
                color: '#2C3E50',
                fontWeight: 600,
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.recognizedText}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>{record.savedAt}</div>
          </div>
          <button
            onClick={() => deleteHistoryItem(record.id)}
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              border: 'none',
              background: 'rgba(0,0,0,0.4)',
              color: '#FFF',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              fontSize: '12px',
              lineHeight: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              padding: 0,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(231,76,60,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
