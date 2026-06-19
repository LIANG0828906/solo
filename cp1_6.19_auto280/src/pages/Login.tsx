import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const AVATAR_COLORS = ['#27AE60', '#2980B9', '#E67E22', '#8E44AD'];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    login({
      id: `user_${Date.now()}`,
      username: username.trim(),
      nickname: nickname.trim() || username.trim(),
      avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      exchange_count: 0,
      trust_count: 0,
      created_at: new Date().toISOString(),
    });
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '36px 28px 28px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏘️</div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#3E2723',
            }}
          >
            邻里食材共享
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#8D6E63' }}>
            分享多余，减少浪费
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.04)',
            borderRadius: 10,
            padding: 3,
            marginBottom: 24,
          }}
        >
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 8,
              background: mode === 'login' ? '#F39C12' : 'transparent',
              color: mode === 'login' ? '#fff' : '#8D6E63',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 8,
              background: mode === 'register' ? '#F39C12' : 'transparent',
              color: mode === 'register' ? '#fff' : '#8D6E63',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#8D6E63',
                marginBottom: 6,
              }}
            >
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #E0C9A6',
                background: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                outline: 'none',
                color: '#3E2723',
              }}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#8D6E63',
                  marginBottom: 6,
                }}
              >
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #E0C9A6',
                  background: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#3E2723',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#8D6E63',
                marginBottom: 6,
              }}
            >
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #E0C9A6',
                background: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                outline: 'none',
                color: '#3E2723',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #F39C12, #E67E22)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(243,156,18,0.3)',
              transition: 'transform 0.1s',
            }}
          >
            {mode === 'login' ? '登 录' : '注 册'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
