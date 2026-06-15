import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (username.trim().length < 2) {
      setError('用户名至少需要2个字符');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    if (password.length < 4) {
      setError('密码至少需要4个字符');
      return;
    }

    if (mode === 'register') {
      const users = JSON.parse(localStorage.getItem('leather_users') || '{}');
      if (users[username]) {
        setError('该用户名已被注册');
        return;
      }
      users[username] = password;
      localStorage.setItem('leather_users', JSON.stringify(users));
    }

    if (mode === 'login') {
      const users = JSON.parse(localStorage.getItem('leather_users') || '{}');
      if (users[username] && users[username] !== password) {
        setError('密码错误');
        return;
      }
      if (!users[username]) {
        setError('用户不存在，请先注册');
        return;
      }
    }

    onLogin(username.trim());
    navigate('/tutorial');
  };

  const handleGuestLogin = () => {
    const guestName = '皮友_' + Math.floor(Math.random() * 10000);
    onLogin(guestName);
    navigate('/tutorial');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{mode === 'login' ? '🔐 登录' : '📝 注册'}</h1>
        <p className="page-subtitle">
          {mode === 'login' ? '欢迎回到匠心工坊' : '加入皮友大家庭'}
        </p>
      </div>

      <div className="paper-card login-card fade-in">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div
              style={{
                color: '#c0392b',
                fontSize: '14px',
                textAlign: 'center',
                padding: '8px',
                backgroundColor: 'rgba(192, 57, 43, 0.1)',
                borderRadius: '4px',
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="leather-btn" style={{ width: '100%' }}>
            {mode === 'login' ? '登 录' : '注 册'}
          </button>
        </form>

        <div className="login-divider">或</div>

        <button
          className="leather-btn"
          style={{ width: '100%', background: 'linear-gradient(145deg, #C9A961, #A67C52)' }}
          onClick={handleGuestLogin}
        >
          🎭 游客体验
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          {mode === 'login' ? (
            <span>
              还没有账号？
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-leather)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginLeft: '4px',
                }}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                立即注册
              </button>
            </span>
          ) : (
            <span>
              已有账号？
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-leather)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginLeft: '4px',
                }}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                去登录
              </button>
            </span>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
          <Link
            to="/tutorial"
            style={{ color: 'var(--color-leather)', textDecoration: 'none' }}
          >
            ← 返回教程首页
          </Link>
        </div>
      </div>
    </div>
  );
}
