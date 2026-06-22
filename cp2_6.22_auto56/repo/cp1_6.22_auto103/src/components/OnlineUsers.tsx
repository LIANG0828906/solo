import React, { useState } from 'react';

const AVATAR_COLORS: Record<string, string> = {
  Alice: '#FF6B6B',
  Bob: '#4ECDC4',
  Charlie: '#FF9F43',
};

interface Props {
  users: string[];
}

export default function OnlineUsers({ users }: Props) {
  const [expanded, setExpanded] = useState(false);

  const displayUsers = users.length > 0 ? users : [];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#aaa',
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      >
        <span style={{ fontSize: 16 }}>👥</span>
        <span>{displayUsers.length} 在线</span>
      </button>

      {expanded && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, background: '#2A2A3E',
          borderRadius: 10, padding: 14, minWidth: 180,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)', zIndex: 100,
          animation: 'fadeInDropdown 0.2s ease-out',
        }}>
          <style>{`
            @keyframes fadeInDropdown {
              from { opacity: 0; transform: translateY(-6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulseOnline {
              0% { opacity: 0.5; }
              50% { opacity: 1; }
              100% { opacity: 0.5; }
            }
          `}</style>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>在线用户</div>
          {displayUsers.length === 0 && (
            <div style={{ fontSize: 13, color: '#555' }}>暂无在线用户</div>
          )}
          {displayUsers.map((u) => (
            <div
              key={u}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                animation: 'fadeInDropdown 0.3s ease-out',
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: AVATAR_COLORS[u] || '#888',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#fff', fontWeight: 600,
                }}>
                  {u[0]}
                </div>
                <div style={{
                  position: 'absolute', bottom: -1, right: -1, width: 10, height: 10,
                  borderRadius: '50%', background: '#00D4AA', border: '2px solid #2A2A3E',
                  animation: 'pulseOnline 2s ease-in-out infinite',
                }} />
              </div>
              <span style={{ fontSize: 13, color: '#ccc' }}>{u}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
