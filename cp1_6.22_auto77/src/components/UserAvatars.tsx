import React from 'react';
import { useMindMap } from '../context/MindMapContext';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const UserAvatars: React.FC = () => {
  const { users, currentUserId, connectionStatus } = useMindMap();

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        bottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(6px)',
        borderRadius: 999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {users.map((u, i) => (
          <div
            key={u.userId}
            title={u.name + (u.userId === currentUserId ? ' (我)' : '')}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: u.avatarColor,
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: i > 0 ? -6 : 0,
              border: '2px solid #fff',
              boxShadow: u.userId === currentUserId ? '0 0 0 2px #4a90d9' : undefined,
              transition: `transform 0.2s ${EASE}`,
              animation: `avatarFadeIn 0.3s ${EASE} both`,
            }}
          >
            {u.name.charAt(u.name.length - 4).toUpperCase()}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 6,
          borderLeft: '1px solid #e0e0e0',
          fontSize: 12,
          color: '#555',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'connecting' ? '#eab308' : '#ef4444',
            display: 'inline-block',
          }}
        />
        {users.length}人在线
      </div>
      <style>{`
        @keyframes avatarFadeIn {
          from { opacity: 0; transform: translateY(6px) scale(0.8); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
