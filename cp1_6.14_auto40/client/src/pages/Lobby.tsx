import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomManager } from '../roomManager';

const BubbleBackground: React.FC = () => {
  const bubbles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: 40 + Math.random() * 100,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 10
    }));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            top: `${b.top}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`
          }}
        />
      ))}
    </div>
  );
};

const Lobby: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'loading'>('menu');
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('gdb_nickname');
    if (saved) setNickname(saved);
  }, []);

  const handleCreate = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    setError('');
    setMode('loading');
    localStorage.setItem('gdb_nickname', nickname.trim());

    try {
      const code = await roomManager.createRoom(nickname.trim());
      setCreatedCode(code);
      setMode('create');
      setTimeout(() => navigate(`/room/${code}`), 1500);
    } catch (e) {
      setError('创建房间失败');
      setMode('menu');
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (joinCode.trim().length < 4) {
      setError('请输入有效的房间码');
      return;
    }
    setError('');
    setMode('loading');
    localStorage.setItem('gdb_nickname', nickname.trim());
    const code = joinCode.trim().toUpperCase();
    roomManager
      .joinRoom(code, nickname.trim())
      .then((ok) => {
        if (ok) {
          navigate(`/room/${code}`);
        } else {
          setError('房间不存在');
          setMode('join');
        }
      })
      .catch(() => {
        setError('加入房间失败');
        setMode('join');
      });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative'
      }}
    >
      <BubbleBackground />

      <div
        className="card fade-in"
        style={{
          maxWidth: 480,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          background: 'rgba(22, 33, 62, 0.9)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎨</div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #e94560, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            猜词对战
          </h1>
          <p style={{ color: '#a0aec0', marginTop: 8, fontSize: 15 }}>
            组队比拼绘画技巧，发挥联想能力的猜词游戏！
          </p>
        </div>

        {mode === 'menu' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#a0aec0',
                  fontWeight: 600
                }}
              >
                你的昵称
              </label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你的昵称"
                className="input-field"
                maxLength={12}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(233, 69, 96, 0.15)',
                  color: '#ff8098',
                  fontSize: 13,
                  textAlign: 'center',
                  border: '1px solid rgba(233, 69, 96, 0.3)'
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => {
                  setMode('create');
                  setError('');
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                🏠 创建房间
              </button>
              <button
                onClick={() => {
                  setMode('join');
                  setError('');
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                🚪 加入房间
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div
            className="fade-in"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}
          >
            <div style={{ fontSize: 52 }}>🎉</div>
            <div>
              <div style={{ fontSize: 15, color: '#a0aec0', marginBottom: 10 }}>
                你的房间码已生成
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  letterSpacing: 12,
                  color: '#e94560',
                  fontFamily: 'monospace',
                  padding: '12px 24px',
                  background: 'rgba(233, 69, 96, 0.1)',
                  borderRadius: 16,
                  border: '2px dashed rgba(233, 69, 96, 0.4)',
                  display: 'inline-block'
                }}
              >
                {createdCode}
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#a0aec0' }}>
              正在进入房间...
            </div>
            <button
              onClick={() => navigate(`/room/${createdCode}`)}
              className="btn btn-primary"
              style={{ marginTop: 10 }}
            >
              立即进入
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#a0aec0',
                  fontWeight: 600
                }}
              >
                你的昵称
              </label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你的昵称"
                className="input-field"
                maxLength={12}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#a0aec0',
                  fontWeight: 600
                }}
              >
                房间码
              </label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="输入6位房间码"
                className="input-field"
                style={{
                  letterSpacing: 6,
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
                maxLength={6}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(233, 69, 96, 0.1)',
                  color: '#ff8098',
                  fontSize: 13,
                  textAlign: 'center',
                  border: '1px solid rgba(233, 69, 96, 0.3)'
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => {
                  setMode('menu');
                  setError('');
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                ← 返回
              </button>
              <button
                onClick={handleJoin}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                🚀 加入
              </button>
            </div>
          </div>
        )}

        {mode === 'loading' && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div
              style={{
                width: 50,
                height: 50,
                border: '4px solid rgba(233, 69, 96, 0.2)',
                borderTop: '4px solid #e94560',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite'
              }}
            />
            <div style={{ color: '#a0aec0', fontSize: 14 }}>处理中...</div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Lobby;
