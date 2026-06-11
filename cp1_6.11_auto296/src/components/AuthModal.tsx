
import { useState } from 'react';
import { useAppStore } from '../store/useStore';
import { api } from '../services/api';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore(state => state.setUser);
  const setToken = useAppStore(state => state.setToken);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await api.auth.login(username, password)
        : await api.auth.register(username, password);

      setToken(result.token);
      setUser(result.user);
      onClose();
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-header">
          <h2 className="auth-title">
            {isLogin ? '藏家登录' : '注册藏家'}
          </h2>
          <div className="auth-seal">印</div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>藏家名号</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入您的藏家名号"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>秘钥</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入您的秘钥"
              className="form-input"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-brush btn-primary auth-submit" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登 录' : '注 册')}
          </button>
        </form>

        <div className="auth-switch">
          <span>{isLogin ? '还未有藏家身份？' : '已有藏家身份？'}</span>
          <button className="auth-switch-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '立即注册' : '前往登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
