import React, { useState } from 'react';
import { useRoomStore } from './store';

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#FFF8F0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  width: '800px',
  maxWidth: '95vw',
  background: '#FFF8F0',
  borderRadius: '16px',
  border: '1px solid #E8D5B7',
  padding: '48px 40px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 300,
  color: '#4A3F4F',
  textAlign: 'center',
  marginBottom: '32px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B5B73',
  marginBottom: '8px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid #E0D0DC',
  fontSize: '15px',
  outline: 'none',
  marginBottom: '16px',
  transition: 'border-color 0.2s ease',
  background: '#FFFAF5',
  color: '#4A3F4F',
};

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '20px',
  background: '#8E6C88',
  color: '#FFF',
  border: 'none',
  fontSize: '15px',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  marginBottom: '24px',
};

const separatorStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#B0A0B8',
  fontSize: '13px',
  margin: '16px 0',
  position: 'relative',
};

const roomCodeDisplay: React.CSSProperties = {
  textAlign: 'center',
  padding: '16px',
  background: '#FAF4F8',
  borderRadius: '12px',
  marginBottom: '16px',
};

const roomCodeTextStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 600,
  color: '#8E6C88',
  letterSpacing: '8px',
};

const roomCodeLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  marginTop: '4px',
};

export default function RoomManager() {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [error, setError] = useState('');
  const { setRoom } = useRoomStore();

  const validateNickname = (name: string): boolean => {
    const cnChars = name.replace(/[^\u4e00-\u9fa5]/g, '');
    return cnChars.length >= 2 && cnChars.length <= 8 && cnChars === name;
  };

  const handleCreate = async () => {
    if (!validateNickname(nickname)) {
      setError('昵称需为2-8个中文字符');
      return;
    }
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      setCreatedCode(data.roomId);
      setRoom(data.roomId, nickname);
    } catch {
      setError('创建房间失败，请检查后端服务');
    }
  };

  const handleJoin = async () => {
    if (!validateNickname(nickname)) {
      setError('昵称需为2-8个中文字符');
      return;
    }
    if (!joinCode || joinCode.length !== 6) {
      setError('请输入6位房间码');
      return;
    }
    setError('');
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: joinCode, nickname }),
      });
      const data = await res.json();
      if (res.ok) {
        setRoom(data.roomId, nickname);
      } else {
        setError(data.error || '加入失败');
      }
    } catch {
      setError('加入房间失败，请检查后端服务');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={titleStyle}>诗语疗愈</div>

        <label style={labelStyle}>匿名昵称</label>
        <input
          style={inputStyle}
          placeholder="请输入2-8个中文字符的昵称"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={8}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#8E6C88')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D0DC')}
        />

        <button
          style={btnStyle}
          onClick={handleCreate}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#7A5D75')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#8E6C88')}
        >
          创建疗愈空间
        </button>

        {createdCode && (
          <div style={roomCodeDisplay}>
            <div style={roomCodeTextStyle}>{createdCode}</div>
            <div style={roomCodeLabelStyle}>房间码 · 分享给ta即可加入</div>
          </div>
        )}

        <div style={separatorStyle}>— 或加入已有空间 —</div>

        <label style={labelStyle}>房间码</label>
        <input
          style={inputStyle}
          placeholder="请输入6位房间码"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#8E6C88')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D0DC')}
        />

        <button
          style={btnStyle}
          onClick={handleJoin}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#7A5D75')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#8E6C88')}
        >
          加入疗愈空间
        </button>

        {error && (
          <div style={{ color: '#E57373', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
