import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { userApi } from '../api';

export default function Login() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const user = await userApi.login(name.trim());
      setUser(user);
      navigate(-1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !name.trim() || loading;

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: '48px 32px',
          boxShadow: 'var(--shadow)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            欢迎来到美食营养
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            输入昵称开始分享美食
          </p>

          <label
            style={{
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
              display: 'block',
            }}
          >
            昵称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入昵称"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 24,
            }}
          />

          {error && (
            <p
              style={{
                color: '#DC2626',
                fontSize: 14,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isDisabled}
            style={{
              width: '100%',
              padding: 14,
              background: 'var(--primary)',
              color: 'white',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              opacity: isDisabled ? 0.6 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
