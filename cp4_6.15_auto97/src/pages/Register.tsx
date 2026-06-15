import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/api';
import { useStore } from '@/store';

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    const response = await register(formData.username, formData.email, formData.password);
    
    if (response.success && response.data) {
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      navigate('/', { replace: true });
    } else {
      setError(response.error || '注册失败');
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1 style={{ fontSize: '28px', textAlign: 'center', marginBottom: '8px', color: 'var(--color-text)' }}>
          创建账户
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginBottom: '32px' }}>
          加入书香阁，开启阅读之旅
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="请输入用户名"
              required
            />
          </div>

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
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input
              type="password"
              className="form-input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="请再次输入密码"
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
            {loading ? '注册中...' : '注册'}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
            已有账户？ 
            <Link to="/login" style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
