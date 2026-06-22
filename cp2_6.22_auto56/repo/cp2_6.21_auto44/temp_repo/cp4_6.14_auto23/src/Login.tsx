import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { authApi } from './api';

const LeafLogo = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--forest-700)' }}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const Login = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, toast, token } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/activities');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await authApi.login(username.trim(), password);
      } else {
        if (!nickname.trim()) {
          toast('请输入昵称', 'error');
          setLoading(false);
          return;
        }
        res = await authApi.register(username.trim(), password, nickname.trim());
      }
      login(res.data.user, res.data.token);
      toast(mode === 'login' ? '登录成功！欢迎回来' : '注册成功！欢迎加入绿色星球', 'success');
      setTimeout(() => navigate('/activities'), 300);
    } catch (err: any) {
      toast(err.response?.data?.error || '操作失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <LeafLogo />
          </div>
          <h1 style={{ fontSize: 26, color: 'var(--forest-900)', marginBottom: 8 }}>绿色星球</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>连接你我，共建绿色家园</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            登录
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">昵称</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入显示昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          )}

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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 8 }}
            disabled={loading}
          >
            {loading ? '处理中...' : mode === 'login' ? '立即登录' : '创建账号'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 16, background: 'var(--mint)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>演示账号：</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
            <span>admin / 123456（环保大使 · 320积分）</span>
            <span>greenlover / 123456（绿色爱好者 · 150积分）</span>
            <span>earthkeeper / 123456（地球守护者 · 680积分）</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
