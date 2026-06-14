import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.nickname.trim().length < 2) {
      setError('昵称长度至少2位');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email.trim(),
        formData.password,
        formData.nickname.trim()
      );
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败');
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #ff8c00 0%, #ffa940 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            创建账号
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>加入我们，开始健身挑战</p>
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
            <label style={labelStyle}>昵称</label>
            <input
              type="text"
              className="input"
              placeholder="你的昵称"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>邮箱</label>
            <input
              type="email"
              className="input"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>密码</label>
            <input
              type="password"
              className="input"
              placeholder="至少8位，包含大小写字母、数字和特殊字符"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '6px',
            }}>
              至少8位，包含大小写字母、数字和特殊字符
            </div>
          </div>

          <div>
            <label style={labelStyle}>确认密码</label>
            <input
              type="password"
              className="input"
              placeholder="再次输入密码"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}>
          已有账号？{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--accent-orange)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            立即登录
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

export default Register;
