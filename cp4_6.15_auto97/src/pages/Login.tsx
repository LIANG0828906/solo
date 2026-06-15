import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '@/api';
import { useStore } from '@/store';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useStore();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const response = await login(formData.email, formData.password);
    
    if (response.success && response.data) {
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      navigate(from, { replace: true });
    } else {
      setError(response.error || '登录失败');
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1 style={{ fontSize: '28px', textAlign: 'center', marginBottom: '8px', color: 'var(--color-text)' }}>
          欢迎回来
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginBottom: '32px' }}>
          登录您的账户，继续探索书香
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="请输入密码"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '16px' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
            还没有账户？ 
            <Link to="/register" style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>
              立即注册
            </Link>
          </p>

          <div style={{ 
            marginTop: '24px', 
            paddingTop: '24px', 
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '12px' }}>
              测试账号：
            </p>
            <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.8' }}>
              <p>管理员：admin@bookstore.com / admin123</p>
              <p>普通用户：zhangsan@example.com / 123456</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
