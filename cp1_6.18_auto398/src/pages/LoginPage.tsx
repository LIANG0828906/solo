import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码');
      return;
    }
    if (password.length < 4) {
      setError('密码至少需要4位字符');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, email.trim() || undefined);
      }
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const inputFields = [
    { username: 'demo', password: 'demo', hint: '演示账号 demo / demo' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.25), transparent 70%)',
          top: -200,
          left: -200,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.2), transparent 70%)',
          bottom: -150,
          right: -150,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-card fade-in"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 40,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="slide-up">
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, var(--accent), #A78BFA)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              boxShadow: '0 12px 32px rgba(108,99,255,0.45)',
              marginBottom: 16,
            }}
          >
            📚
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 6,
              background: 'linear-gradient(135deg, #FFFFFF, #B4AEFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            韵动书架
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            构建属于你的虚拟阅读空间
          </p>
        </div>

        <div
          className="slide-up stagger-1"
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
          }}
        >
          {[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key as 'login' | 'register')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: mode === item.key ? '#FFFFFF' : 'var(--text-muted)',
                background: mode === item.key ? 'var(--accent)' : 'transparent',
                transition: 'all 0.25s ease',
                boxShadow: mode === item.key ? '0 4px 16px rgba(108,99,255,0.4)' : 'none',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="slide-up stagger-2" style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
              用户名
            </label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>

          {mode === 'register' && (
            <div className="slide-up stagger-2" style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                邮箱（选填）
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
          )}

          <div className="slide-up stagger-3" style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
              密码
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            />
          </div>

          {error && (
            <div
              className="slide-up stagger-4"
              style={{
                padding: '12px 16px',
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#FCA5A5',
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div className="slide-up stagger-4" style={{ marginBottom: 14 }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px 24px', fontSize: 15 }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'skeletonShimmer 0.8s linear infinite',
                    }}
                  />
                  处理中...
                </>
              ) : mode === 'login' ? '登 录' : '创建账号'}
            </button>
          </div>

          <div
            className="slide-up stagger-5"
            style={{
              padding: 12,
              background: 'rgba(108,99,255,0.08)',
              border: '1px dashed rgba(108,99,255,0.25)',
              borderRadius: 10,
              fontSize: 12,
              color: '#B4AEFF',
              textAlign: 'center',
            }}
          >
            💡 {inputFields[0].hint}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
