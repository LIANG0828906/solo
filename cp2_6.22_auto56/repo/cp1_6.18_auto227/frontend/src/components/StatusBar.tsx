import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { getRandomCursorColor } from '../utils';
import { Task } from '../types';

export const StatusBar: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const tasks = useAppStore((state) => state.tasks);
  const cursors = useAppStore((state) => state.cursors);
  const currentUserId = useAppStore((state) => state.currentUserId);

  const currentUserColor = useMemo(() => getRandomCursorColor(), []);

  const onlineUsers = Object.keys(cursors).length + 1;

  const filteredCount = searchText.trim()
    ? tasks.filter((t: Task) => t.name.toLowerCase().includes(searchText.toLowerCase())).length
    : tasks.length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        padding: '16px 32px',
        background: 'rgba(30, 30, 62, 0.6)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7C3AED, #4ECDC4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700
          }}
        >
          ⏱
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>协作时光轴</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
            {filteredCount} 个任务 · {onlineUsers} 人在线
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              background: '#2A2A4E',
              border: isFocused ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease-out',
              boxShadow: isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.5), 0 0 20px rgba(124, 58, 237, 0.3)' : 'none'
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '14px'
            }}
          >
            🔍
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#32CD32',
              boxShadow: '0 0 8px #32CD32',
              animation: 'pulse 2s infinite'
            }}
          />
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>已连接</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentUserColor}, ${currentUserColor}88)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: `0 0 12px ${currentUserColor}66`
            }}
          >
            {currentUserId.slice(-2).toUpperCase()}
          </div>

          {Object.values(cursors).slice(0, 3).map((cursor) => (
            <div
              key={cursor.userId}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${cursor.color}, ${cursor.color}88)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
                boxShadow: `0 0 8px ${cursor.color}44`,
                marginLeft: '-8px',
                border: '2px solid #1A1A3A'
              }}
              title={cursor.userName || cursor.userId}
            >
              {cursor.userId.slice(-2).toUpperCase()}
            </div>
          ))}

          {Object.keys(cursors).length > 3 && (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
                marginLeft: '-8px',
                border: '2px solid #1A1A3A',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            >
              +{Object.keys(cursors).length - 3}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
