import { useState, useRef } from 'react';
import { X, User, Lock } from 'lucide-react';
import { useAuthStore } from './UserManager';
import { useNavigate } from 'react-router-dom';

interface LoginPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginPanel({ isOpen, onClose }: LoginPanelProps) {
  const [loginType, setLoginType] = useState<'admin' | 'reader'>('reader');
  const [readerName, setReaderName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const loginAsAdmin = useAuthStore((state) => state.loginAsAdmin);
  const loginAsReader = useAuthStore((state) => state.loginAsReader);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setError('');
      setReaderName('');
      setPassword('');
      setIsClosing(false);
    }, 300);
  };

  const triggerErrorShake = (inputRef: React.RefObject<HTMLInputElement>) => {
    const element = inputRef.current;
    if (element) {
      element.style.borderColor = 'var(--color-red)';
      element.classList.add('shake');
      setTimeout(() => {
        element.classList.remove('shake');
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginType === 'reader') {
      const trimmedName = readerName.trim();
      if (!trimmedName) {
        setError('请输入您的名字');
        triggerErrorShake(nameInputRef);
        return;
      }
      loginAsReader(trimmedName);
      handleClose();
      navigate('/profile');
    } else {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);

      if (!password) {
        setError('请输入管理员密码');
        triggerErrorShake(passwordInputRef);
        return;
      }

      const success = loginAsAdmin(password);
      if (!success) {
        setError('密码错误，请重试');
        triggerErrorShake(passwordInputRef);
      } else {
        handleClose();
        navigate('/admin/books');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">登录</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${loginType === 'reader' ? 'active' : ''}`}
            onClick={() => {
              setLoginType('reader');
              setError('');
            }}
          >
            读者登录
          </button>
          <button
            className={`login-tab ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setLoginType('admin');
              setError('');
            }}
          >
            管理员登录
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {loginType === 'reader' ? (
            <div className="form-group">
              <label className="form-label">您的名字</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  ref={nameInputRef}
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={readerName}
                  onChange={(e) => {
                    setReaderName(e.target.value);
                    if (error) {
                      setError('');
                      e.target.style.borderColor = '';
                    }
                  }}
                  placeholder="请输入您的名字"
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">管理员密码</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  ref={passwordInputRef}
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) {
                      setError('');
                      e.target.style.borderColor = '';
                    }
                  }}
                  placeholder="请输入管理员密码"
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#999', marginTop: 8 }}>
                默认密码: admin123
              </p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
            >
              登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
