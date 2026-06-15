import React, { useState } from 'react';

const COLOR_PALETTE = ['#FF6B35', '#004E89', '#1A936F', '#FFA630', '#D81B60'];

interface JoinScreenProps {
  onJoin: (nickname: string, roomCode: string) => void;
}

export default function JoinScreen({ onJoin }: JoinScreenProps) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim() && roomCode.trim().length === 6) {
      onJoin(nickname.trim(), roomCode.trim().toUpperCase());
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: '#FEFAE0',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: 420,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💡</div>
        <h1 style={{
          color: '#2D7D9A', fontSize: 24, fontWeight: 700,
          marginBottom: 8,
        }}>团队点子孵化器</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>
          提交创意、评论补充、投票选出最佳方案
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="输入你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 8,
              border: '2px solid #e0e0e0', fontSize: 16, marginBottom: 16,
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2D7D9A'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
          <input
            type="text"
            placeholder="输入6位房间码"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 8,
              border: '2px solid #e0e0e0', fontSize: 16, marginBottom: 24,
              letterSpacing: 4, textAlign: 'center', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2D7D9A'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
          <button
            type="submit"
            disabled={!nickname.trim() || roomCode.length !== 6}
            style={{
              width: '100%', padding: '14px', borderRadius: 8,
              background: (!nickname.trim() || roomCode.length !== 6) ? '#ccc' : '#2D7D9A',
              color: '#fff', fontSize: 16, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            加入房间
          </button>
        </form>
      </div>
    </div>
  );
}
