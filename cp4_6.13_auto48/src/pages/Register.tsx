import React, { useState } from 'react';
import { registerUser, loginUser } from '../api';
import { useAppContext } from '../App';

export default function Register({ navigate }: { navigate: (path: string) => void }) {
  const { setUser } = useAppContext();
  const [isLogin, setIsLogin] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const user = await loginUser({ nickname, password });
        setUser(user);
      } else {
        const user = await registerUser({ nickname, password });
        setUser(user);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '420px',
      margin: '60px auto',
      padding: '40px 32px',
      background: '#fff',
      borderRadius: '20px',
      boxShadow: '0 4px 24px rgba(139,94,60,0.12)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px' }}>
          <path d="M2 21h18v-2H2v2zM20 8h-1V5H3v3H2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v3h16v-3h1c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zm-15 8V9H5v7h-1zm13 0H7V9h11v7z" fill="#D4A574"/>
        </svg>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#8B5E3C', fontSize: '24px' }}>
          {isLogin ? '欢迎回来' : '加入咖啡角'}
        </h2>
        <p style={{ fontFamily: 'Georgia, serif', color: '#A0887A', fontSize: '14px', marginTop: '8px' }}>
          {isLogin ? '登录后继续交换闲置好物' : '注册后即可发布和交换物品'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'Georgia, serif',
            color: '#8B5E3C',
            fontSize: '14px',
            marginBottom: '6px',
          }}>
            昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="你的昵称"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #E8DDD3',
              borderRadius: '12px',
              fontSize: '15px',
              fontFamily: 'Georgia, serif',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#D4A574'}
            onBlur={e => e.currentTarget.style.borderColor = '#E8DDD3'}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'Georgia, serif',
            color: '#8B5E3C',
            fontSize: '14px',
            marginBottom: '6px',
          }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="你的密码"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #E8DDD3',
              borderRadius: '12px',
              fontSize: '15px',
              fontFamily: 'Georgia, serif',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#D4A574'}
            onBlur={e => e.currentTarget.style.borderColor = '#E8DDD3'}
          />
        </div>

        {error && (
          <div style={{
            background: '#FFF0F0',
            color: '#D32F2F',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'Georgia, serif',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#C4B5A4' : 'linear-gradient(135deg, #D4A574, #8B5E3C)',
            color: '#FFF8F0',
            border: 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {loading ? '处理中...' : (isLogin ? '登 录' : '注 册')}
        </button>
      </form>

      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#A0887A',
      }}>
        {isLogin ? '还没有账号？' : '已有账号？'}
        <span
          style={{ color: '#D4A574', cursor: 'pointer', marginLeft: '4px' }}
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
        >
          {isLogin ? '去注册' : '去登录'}
        </span>
      </div>
    </div>
  );
}
