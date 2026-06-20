import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!nickname.trim()) {
          throw new Error('请输入昵称');
        }
        await register(email, password, nickname);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          background: '#FFF8DC',
          borderRadius: '16px',
          border: '2px solid #8B4513',
          boxShadow: '0 8px 32px rgba(92, 51, 23, 0.2)',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
          <h1 style={{ fontSize: '28px', color: '#5C3317', marginBottom: '8px' }}>
            {isLogin ? '欢迎回来' : '加入乐器市场'}
          </h1>
          <p style={{ color: '#8B4513', fontSize: '14px' }}>
            {isLogin ? '登录您的账户，继续探索' : '创建账户，开始您的乐器之旅'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入您的昵称"
                style={{ width: '100%', height: '44px' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              style={{ width: '100%', height: '44px' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={{ width: '100%', height: '44px' }}
              required
            />
          </div>

          {error && (
            <div
              style={{
                background: '#FFEBEB',
                border: '1px solid #E53935',
                color: '#C62828',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#FF8C00',
              color: 'white',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              height: '48px',
              boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <span style={{ color: '#8B4513', fontSize: '14px' }}>
            {isLogin ? '还没有账户？' : '已有账户？'}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'transparent',
              color: '#FF8C00',
              fontSize: '14px',
              fontWeight: '600',
              marginLeft: '4px',
            }}
          >
            {isLogin ? '立即注册' : '立即登录'}
          </button>
        </div>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px dashed #DEB887',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '12px', color: '#8B4513', marginBottom: '8px' }}>
            演示账户：demo@example.com / 123456
          </p>
          <Link
            to="/"
            style={{
              color: '#8B4513',
              fontSize: '14px',
              textDecoration: 'underline',
            }}
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
