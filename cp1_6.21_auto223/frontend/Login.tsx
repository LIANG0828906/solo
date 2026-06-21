import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from './context';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = mode === 'login' ? '/api/users/login' : '/api/users/register';
      const { data } = await axios.post(endpoint, { username, password });
      setCurrentUser(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">{mode === 'login' ? '欢迎回来' : '创建账号'}</h2>
        <p className="auth-subtitle">
          {mode === 'login' ? '登录以使用项目看板' : '注册新账号开始协作'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          {error && (
            <div
              style={{
                color: '#EF4444',
                fontSize: 13,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}
          <button type="submit" className="accent" style={{ width: '100%', padding: '12px' }}>
            {mode === 'login' ? '登 录' : '注 册'}
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <a onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '立即注册' : '立即登录'}
          </a>
        </div>
        <div className="auth-switch" style={{ fontSize: 11, marginTop: 24 }}>
          演示账号：Alice / 123456
        </div>
      </div>
    </div>
  );
};

export default Login;
