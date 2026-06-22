import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Coffee, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './LoginPage.css';

export function LoginPage() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    setIsLoading(true);
    try {
      await login(nickname.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <Coffee className="login-icon" size={40} />
          </div>
          <h1 className="login-title">欢迎回来</h1>
          <p className="login-subtitle">输入昵称，参与咖啡拼配共创</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nickname" className="form-label">
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              className="form-input"
              placeholder="请输入你的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner" />
            ) : (
              <>
                <LogIn size={20} />
                <span>登录 / 注册</span>
              </>
            )}
          </button>
        </form>

        <p className="login-tip">
          无需密码，输入昵称即可登录。
          <br />
          首次使用将自动创建账号。
        </p>
      </div>
    </div>
  );
}
