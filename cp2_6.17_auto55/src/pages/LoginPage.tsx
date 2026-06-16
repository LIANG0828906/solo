import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const LoginPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!username.trim()) {
        setError('用户名不能为空');
        return;
      }
      if (password.length < 4) {
        setError('密码至少4位');
        return;
      }
      const success = await register(username.trim(), password);
      if (success) {
        navigate('/browse');
      } else {
        setError('用户名已存在');
      }
    } else {
      const success = await login(username.trim(), password);
      if (success) {
        navigate('/browse');
      } else {
        setError('用户名或密码错误');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="auth-container">
        <div className="auth-tabs">
          <div
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            登录
          </div>
          <div
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            注册
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          {error && (
            <p style={{ color: 'red', marginBottom: '12px', fontSize: '14px' }}>{error}</p>
          )}
          <button
            type="submit"
            className="auth-btn"
            style={{ background: '#E67E22', color: 'white', borderRadius: '6px', width: '100%' }}
          >
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
