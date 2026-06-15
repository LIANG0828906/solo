import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { addRipple } from '../../shared/utils';

export default function LoginPage() {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('请输入昵称');
      return;
    }
    login(trimmed);
    navigate('/', { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">二手书交换</h1>
        <p className="login-subtitle">输入昵称，开启阅读之旅</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nickname">你的昵称</label>
            <input
              id="nickname"
              type="text"
              className="form-input"
              placeholder="请输入昵称..."
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              autoFocus
            />
            {error && <span style={{ color: 'var(--color-red)', fontSize: '0.85rem' }}>{error}</span>}
          </div>
          <button type="submit" className="btn-primary" onMouseDown={addRipple}>
            进入书屋
          </button>
        </form>
      </div>
    </div>
  );
}
