import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shakeUsername, setShakeUsername] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const validate = (): boolean => {
    let valid = true;
    setError('');

    if (!username.trim()) {
      setShakeUsername(true);
      setTimeout(() => setShakeUsername(false), 400);
      valid = false;
    }
    if (!password.trim()) {
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 400);
      valid = false;
    }
    if (!valid) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 400);
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error || '登录失败，请稍后重试';
      setError(msg);
      setShakeForm(true);
      setShakeUsername(true);
      setShakePassword(true);
      setTimeout(() => {
        setShakeForm(false);
        setShakeUsername(false);
        setShakePassword(false);
      }, 400);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 50%, #ec4899 100%)',
        padding: '16px',
      }}
    >
      <div
        className={shakeForm ? 'shake' : ''}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 36px',
          borderRadius: '8px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '8px',
              background: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              color: '#fff',
              marginBottom: '16px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            O
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            团队OKR管理系统
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            登录以继续使用系统
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className={shakeUsername ? 'shake' : ''}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-light)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className={shakePassword ? 'shake' : ''}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-light)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger)',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <button
            ref={btnRef}
            type="submit"
            disabled={loading}
            className="ripple-effect"
            onClick={createRipple}
            style={{
              padding: '12px',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '8px',
              background: 'var(--accent)',
              color: '#fff',
              transition: 'transform 0.2s, background 0.2s, opacity 0.2s',
              marginTop: '8px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            padding: '14px 16px',
            borderRadius: '8px',
            background: 'var(--accent-light)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>💡</span> 默认账号
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              管理员：<code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>manager</code> / <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>123456</code>
            </div>
            <div>
              成员1：<code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>member1</code> / <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>123456</code>
            </div>
            <div>
              成员2：<code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>member2</code> / <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>123456</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
