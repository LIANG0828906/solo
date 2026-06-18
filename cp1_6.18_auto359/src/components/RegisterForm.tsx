import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useStore } from '@/store';

export function RegisterForm() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useStore();
  const [form, setForm] = useState({ username: '', password: '', nickname: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (form.password !== form.confirmPassword) {
      useStore.getState().error = '两次输入的密码不一致';
      return;
    }

    try {
      await register(form.username, form.password, form.nickname);
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
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>
          创建账户
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          加入 AgileFlow，开启敏捷之旅
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            昵称
          </label>
          <input
            type="text"
            className="input"
            placeholder="输入你的昵称"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            用户名
          </label>
          <input
            type="text"
            className="input"
            placeholder="输入登录用户名"
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
            placeholder="输入密码（至少6位）"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            确认密码
          </label>
          <input
            type="password"
            className="input"
            placeholder="再次输入密码"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            minLength={6}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !form.username || !form.password || !form.nickname || !form.confirmPassword}
          style={{ width: '100%', marginTop: '8px' }}
        >
          <UserPlus size={18} />
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>已有账户？</span>
        {' '}
        <Link
          to="/login"
          style={{ color: 'var(--color-accent)', fontWeight: 500 }}
        >
          立即登录
        </Link>
      </div>
    </div>
  );
}
