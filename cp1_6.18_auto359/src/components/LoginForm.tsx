import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useStore } from '@/store';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useStore();
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      // Error is handled in store
    }
  };

  return (
    <div className="glass" style={{
      borderRadius: '16px',
      padding: '40px',
      width: '100%',
      maxWidth: '420px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>
          欢迎回来
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          登录你的 AgileFlow 账户
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(231, 76, 60, 0.1)',
          border: '1px solid var(--color-accent)',
          color: 'var(--color-accent)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            用户名
          </label>
          <input
            type="text"
            className="input"
            placeholder="输入用户名"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            密码
          </label>
          <input
            type="password"
            className="input"
            placeholder="输入密码"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !form.username || !form.password}
          style={{ width: '100%' }}
        >
          <LogIn size={18} />
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>还没有账户？</span>
        {' '}
        <Link
          to="/register"
          style={{ color: 'var(--color-accent)', fontWeight: 500 }}
        >
          立即注册
        </Link>
      </div>
    </div>
  );
}
