import React, { useState } from 'react';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiCall = mode === 'login' ? authApi.login : authApi.register;
      const res = await apiCall(username, password);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || (mode === 'login' ? '登录失败' : '注册失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px 32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            fontSize: 32,
            fontWeight: 700,
            margin: '0 0 8px',
            background: 'linear-gradient(135deg, #e94560, #0f3460)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 4,
          }}
        >
          城市寻宝
        </h1>
        <p
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: '#888',
            margin: '0 0 32px',
          }}
        >
          探索城市隐藏的宝藏
        </p>

        <div
          style={{
            display: 'flex',
            position: 'relative',
            marginBottom: 28,
            borderBottom: '2px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              color: mode === 'login' ? '#e94560' : '#666',
              fontSize: 15,
              fontWeight: mode === 'login' ? 600 : 400,
              cursor: 'pointer',
              transition: 'color 0.3s, font-weight 0.3s',
              position: 'relative',
              zIndex: 1,
            }}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              color: mode === 'register' ? '#e94560' : '#666',
              fontSize: 15,
              fontWeight: mode === 'register' ? 600 : 400,
              cursor: 'pointer',
              transition: 'color 0.3s, font-weight 0.3s',
              position: 'relative',
              zIndex: 1,
            }}
          >
            注册
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              left: mode === 'login' ? '0%' : '50%',
              width: '50%',
              height: 2,
              background: '#e94560',
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 1,
            }}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#16213e',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                color: '#eee',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#e94560'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#16213e',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                color: '#eee',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#e94560'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: 'rgba(233, 69, 96, 0.15)',
                border: '1px solid rgba(233, 69, 96, 0.3)',
                borderRadius: 8,
                color: '#e94560',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: loading
                ? '#555'
                : 'linear-gradient(135deg, #e94560, #0f3460)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.3s, transform 0.15s',
              letterSpacing: 2,
            }}
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
}
