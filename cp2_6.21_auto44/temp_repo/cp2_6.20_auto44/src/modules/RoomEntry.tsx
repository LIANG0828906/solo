import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdeasStore } from '../store/ideasStore';

export const RoomEntry: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const { initRoom, loading } = useIdeasStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !userName.trim()) return;
    await initRoom(roomId.trim(), userName.trim());
    navigate(`/room/${roomId.trim()}`);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)',
        padding: '20px',
      }}
    >
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 32px',
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>💡</div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #f97316, #fb923c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            团队创意头脑风暴
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>实时协作，激发无限创意</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
              }}
            >
              房间号
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="如：idea-2024"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#f1f5f9',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)';
                e.target.style.background = 'rgba(255,255,255,0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
              }}
            >
              你的名字
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="输入你的名字"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#f1f5f9',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)';
                e.target.style.background = 'rgba(255,255,255,0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !roomId.trim() || !userName.trim()}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background:
                roomId.trim() && userName.trim()
                  ? 'linear-gradient(135deg, #f97316, #ea580c)'
                  : 'rgba(249, 115, 22, 0.3)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: roomId.trim() && userName.trim() ? 'pointer' : 'not-allowed',
              boxShadow:
                roomId.trim() && userName.trim()
                  ? '0 6px 20px rgba(249, 115, 22, 0.35)'
                  : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? '进入中...' : '🚀 进入头脑风暴'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#475569' }}>
            提示：输入相同房间号即可和团队成员一起头脑风暴
          </p>
        </div>
      </div>
    </div>
  );
};
