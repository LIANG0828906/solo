import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { request } = useApi();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '440px',
      margin: '40px auto',
      background: '#fff',
      borderRadius: '16px',
      padding: '40px',
      border: '2px solid #E8DCC8',
      boxShadow: '0 4px 20px rgba(139, 94, 60, 0.1)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: '#E67E22',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}>
          手
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#E67E22', marginBottom: '8px' }}>欢迎回来</h2>
        <p style={{ fontSize: '14px', color: '#8B5E3C' }}>登录手工坊社区，开启你的手作之旅</p>
      </div>

      {error && (
        <div style={{
          background: '#FDEDEC',
          color: '#E74C3C',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
            邮箱地址
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入您的邮箱"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '2px solid #E8DCC8',
              fontSize: '15px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#E67E22')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E8DCC8')}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入您的密码"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '2px solid #E8DCC8',
              fontSize: '15px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#E67E22')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E8DCC8')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            background: loading ? '#F5B77A' : '#E67E22',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
        还没有账号？
        <Link to="/register" style={{ color: '#E67E22', fontWeight: '600', marginLeft: '4px' }}>
          立即注册
        </Link>
      </div>
    </div>
  );
};

export default Login;
