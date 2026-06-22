import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useShallow } from 'zustand/react/shallow';

export const BattleLog: React.FC = () => {
  const logs = useGameStore(useShallow((s) => s.logs));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      style={{
        background: '#1E1E2E',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#FFD700' }}>
        战斗日志
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingRight: 4,
          scrollBehavior: 'smooth',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic' }}>
            战斗即将开始...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                fontSize: 12,
                padding: '6px 8px',
                background: log.player === 'player' ? 'rgba(74, 144, 217, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                borderRadius: 6,
                borderLeft: `3px solid ${log.player === 'player' ? '#4A90D9' : '#E74C3C'}`,
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              <span style={{ opacity: 0.6, fontSize: 10 }}>回合{log.turn} </span>
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
