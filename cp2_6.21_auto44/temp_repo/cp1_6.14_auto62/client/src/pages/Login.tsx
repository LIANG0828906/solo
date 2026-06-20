import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        animation: 'slideUp 0.5s ease-out',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💪</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #ff8c00 0%, #ffa940 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            欢迎回来
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>登录继续你的健身之旅</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(255, 77, 79, 0.15)',
              border: '1px solid rgba(255, 77, 79, 0.3)',
              borderRadius: '8px',
              color: '#ff7875',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>邮箱</label>
            <input
              type="email"
              className="input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>密码</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              marginTop: '8px',
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}>
          还没有账号？{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--accent-orange)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
};

export default Login;
