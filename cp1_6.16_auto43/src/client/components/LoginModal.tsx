import React, { useState } from 'react';

interface LoginModalProps {
  onLogin: (nickname: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsLoading(true);
    try {
      await onLogin(nickname.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="login-title">🌱 欢迎来到种子交换平台</h2>
        <p className="login-subtitle">请输入您的昵称开始交换之旅</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">昵称</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoFocus
              maxLength={20}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!nickname.trim() || isLoading}
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
          >
            {isLoading ? '登录中...' : '进入平台'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
