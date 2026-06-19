import React, { useCallback } from 'react';
import { useSceneStore } from '../store/sceneStore';

const HistoryPanel: React.FC = () => {
  const history = useSceneStore((s) => s.history);
  const restoreSnapshot = useSceneStore((s) => s.restoreSnapshot);

  const handleClick = useCallback((snapshotId: string) => {
    restoreSnapshot(snapshotId);
  }, [restoreSnapshot]);

  return (
    <div
      style={{
        width: 120,
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #E5E5E5',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 12px', borderBottom: '1px solid #F0F0F0' }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#333' }}>历史记录</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#999' }}>按 P 键拍照</p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {history.length === 0 && (
          <div style={{
            fontSize: '11px',
            color: '#BBB',
            textAlign: 'center',
            padding: '20px 0',
          }}>
            暂无截图
          </div>
        )}
        {history.map((snapshot) => {
          const date = new Date(snapshot.timestamp);
          const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
          return (
            <div
              key={snapshot.id}
              onClick={() => handleClick(snapshot.id)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = 'scale(1)')}
            >
              <img
                src={snapshot.thumbnail}
                alt={`快照 ${timeStr}`}
                style={{
                  width: 80,
                  borderRadius: 4,
                  border: '1px solid #E0E0E0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  display: 'block',
                }}
                draggable={false}
              />
              <span style={{ fontSize: '10px', color: '#888' }}>{timeStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPanel;
