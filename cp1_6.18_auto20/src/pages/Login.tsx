import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    localStorage.setItem('userName', name.trim());
    navigate('/timeline');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--panel-bg)',
          borderRadius: '24px',
          padding: '40px 32px',
          border: '1px solid var(--card-border)',
          animation: 'fadeInUp 500ms ease-out',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6C63FF 0%, #FF6B6B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(108, 99, 255, 0.3)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            笔记共鸣
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            记录此刻，与世界共振
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              fontWeight: 500,
            }}
          >
            你的名字
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入一个名字开始..."
            autoFocus
            style={{
              width: '100%',
              height: '48px',
              padding: '0 16px',
              borderRadius: '12px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              border: '1px solid transparent',
              marginBottom: '24px',
              transition: 'border-color 300ms ease',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'transparent';
            }}
          />

          <button
            type="submit"
            disabled={!name.trim() || loading}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              transition: 'all 300ms ease',
              opacity: !name.trim() || loading ? 0.5 : 1,
              cursor: !name.trim() || loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)',
            }}
          >
            {loading ? '进入中...' : '进入共鸣空间'}
          </button>
        </form>

        <p
          style={{
            marginTop: '24px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          在这里，每一个想法都会产生涟漪
          <br />
          与同频的灵魂相遇
        </p>
      </div>
    </div>
  );
};
