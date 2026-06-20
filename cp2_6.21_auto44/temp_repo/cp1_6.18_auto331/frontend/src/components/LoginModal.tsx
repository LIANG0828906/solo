import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { authAPI } from '../services/api';
import { saveUserToCache, getUserFromCache } from '../utils/indexedDB';

export default function LoginModal() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setUser = useAppStore((state) => state.setUser);
  const isOnline = useAppStore((state) => state.isOnline);

  useEffect(() => {
    const checkCachedUser = async () => {
      const cachedUser = await getUserFromCache();
      if (cachedUser && !isOnline) {
        setUser(cachedUser);
      }
    };
    checkCachedUser();
  }, [setUser, isOnline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isRegister
        ? await authAPI.register(username, password)
        : await authAPI.login(username, password);

      setUser(result.user);
      await saveUserToCache(result.user);
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal">
      <div className="login-container">
        <h2 className="login-title">语音地图</h2>
        <p className="login-subtitle">{isRegister ? '创建新账户' : '登录你的账户'}</p>

        {error && <div className="login-error">{error}</div>}

        {!isOnline && (
          <div className="offline-notice">当前处于离线模式，部分功能受限</div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading || !isOnline}
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading || !isOnline}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !isOnline}
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <div className="login-switch">
          <span>{isRegister ? '已有账户？' : '没有账户？'}</span>
          <button
            className="switch-btn"
            onClick={() => setIsRegister(!isRegister)}
            disabled={loading || !isOnline}
          >
            {isRegister ? '去登录' : '去注册'}
          </button>
        </div>

        <p className="demo-tip">演示账户: demo / demo123</p>
      </div>

      <style>{`
        .login-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #0A0E27 0%, #1A237E 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .login-container {
          background: #1E1E2E;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: #E0E0E0;
          text-align: center;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #7C4DFF, #00BFFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-subtitle {
          color: #B0B0B0;
          text-align: center;
          margin: 0 0 24px 0;
          font-size: 14px;
        }

        .login-error {
          background: rgba(255, 99, 71, 0.15);
          color: #FF6347;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
        }

        .offline-notice {
          background: rgba(255, 165, 0, 0.15);
          color: #FFA500;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          color: #B0B0B0;
          font-size: 13px;
        }

        .form-group input {
          background: #2A2A3A;
          border: 1px solid #3D3D3D;
          border-radius: 10px;
          padding: 12px 14px;
          color: #E0E0E0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          border-color: #7C4DFF;
        }

        .form-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-btn {
          background: linear-gradient(135deg, #7C4DFF, #00BFFF);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 8px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(124, 77, 255, 0.4);
        }

        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-switch {
          text-align: center;
          margin-top: 20px;
          color: #B0B0B0;
          font-size: 13px;
        }

        .switch-btn {
          background: none;
          border: none;
          color: #7C4DFF;
          cursor: pointer;
          font-size: 13px;
          padding: 0 4px;
        }

        .switch-btn:hover {
          text-decoration: underline;
        }

        .demo-tip {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}
