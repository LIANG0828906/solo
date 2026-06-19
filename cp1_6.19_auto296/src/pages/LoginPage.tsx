import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

const LoginPage = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('用户名或密码错误');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1E1E2E 0%, #2D2D44 50%, #1E1E2E 100%)',
        padding: '20px'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#2D2D44',
          borderRadius: '16px',
          padding: '48px 40px',
          boxShadow: '0 20px 60px rgba(124, 58, 237, 0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #7C3AED, #9B5DE5)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px',
              fontWeight: 700,
              color: '#fff'
            }}
          >
            P
          </motion.div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: '#E0E0E0',
              marginBottom: '8px'
            }}
          >
            项目协作看板
          </h1>
          <p style={{ fontSize: '14px', color: '#8B8BA3' }}>
            欢迎回来，请登录您的账号
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#C0C0D0',
                marginBottom: '8px'
              }}
            >
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={{
                width: '100%',
                height: '48px',
                padding: '0 16px',
                background: '#1E1E2E',
                border: '2px solid #3D3D5C',
                borderRadius: '12px',
                color: '#E0E0E0',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7C3AED';
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#3D3D5C';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#C0C0D0',
                marginBottom: '8px'
              }}
            >
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={{
                width: '100%',
                height: '48px',
                padding: '0 16px',
                background: '#1E1E2E',
                border: '2px solid #3D3D5C',
                borderRadius: '12px',
                color: '#E0E0E0',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7C3AED';
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#3D3D5C';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#F87171',
                fontSize: '13px',
                marginBottom: '20px'
              }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ backgroundColor: '#9B5DE5' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              width: '100%',
              height: '50px',
              background: '#7C3AED',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              transition: 'background-color 0.2s',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                登录中...
              </span>
            ) : (
              '登 录'
            )}
          </motion.button>
        </form>

        <div
          style={{
            marginTop: '28px',
            padding: '14px 16px',
            background: 'rgba(124, 58, 237, 0.08)',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#8B8BA3',
            textAlign: 'center',
            lineHeight: '1.6'
          }}
        >
          <span style={{ color: '#A78BFA', fontWeight: 500 }}>测试账号：</span>
          admin / 123456
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
