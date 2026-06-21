import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/documents', { replace: true });
  }, [navigate]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid transparent',
    background: '#334155',
    color: '#E2E8F0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await axios.post(url, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/documents');
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F172A'
    }}>
      <div style={{
        width: '400px',
        maxWidth: '90vw',
        background: '#1E293B',
        borderRadius: '16px',
        padding: '32px'
      }}>
        <h1 style={{
          color: '#E2E8F0',
          fontSize: '24px',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          DocCollab
        </h1>
        <p style={{
          color: '#94A3B8',
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          团队文档协作平台
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#EF4444',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              用户名
            </label>
            <input
              style={inputStyle}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
              onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              密码
            </label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
              onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#6366F1',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#4F46E5'}
            onMouseLeave={e => e.currentTarget.style.background = '#6366F1'}
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>
            {isRegister ? '已有账号？' : '没有账号？'}
          </span>
          <span
            style={{
              color: '#6366F1',
              fontSize: '13px',
              cursor: 'pointer',
              marginLeft: '4px',
              transition: 'color 0.2s ease'
            }}
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            onMouseEnter={e => e.currentTarget.style.color = '#4F46E5'}
            onMouseLeave={e => e.currentTarget.style.color = '#6366F1'}
          >
            {isRegister ? '去登录' : '去注册'}
          </span>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: '#0F172A',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#64748B',
          lineHeight: 1.6
        }}>
          测试账号: admin / admin123
        </div>
      </div>
    </div>
  );
}
