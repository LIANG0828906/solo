import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useProjectStore } from '../store/projectStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useProjectStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      setUser(user);
      navigate('/studio');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🧵</div>
          <div style={styles.appTitle}>拼布设计工作室</div>
          <div style={styles.appSubtitle}>Quilt Design Studio</div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / customer1"
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123 / cust123"
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={styles.hintBox}>
          <div style={styles.hintTitle}>演示账号：</div>
          <div style={styles.hintRow}>管理员：<b>admin</b> / admin123</div>
          <div style={styles.hintRow}>设计师：<b>customer1</b> / cust123</div>
        </div>
      </div>

      <div style={styles.decoration1} />
      <div style={styles.decoration2} />
      <div style={styles.decoration3} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: '#F5F0E8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  },
  card: {
    width: 400,
    background: '#FFFAF4',
    borderRadius: 20,
    padding: 40,
    boxShadow: '0 20px 60px rgba(93, 64, 55, 0.15)',
    zIndex: 2,
    border: '1px solid #E8DDD0',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#5D4037',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#8D6E63',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  error: {
    background: '#FCE8E8',
    color: '#C94A4A',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    border: '1px solid #F5C8C8',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#5D4037',
  },
  input: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #D7C4A1',
    background: '#FFFAF4',
    fontSize: 14,
    color: '#5D4037',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  submitBtn: {
    marginTop: 8,
    padding: '14px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    color: '#FFFAF4',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 12px rgba(184, 115, 51, 0.3)',
    fontFamily: 'inherit',
  },
  hintBox: {
    marginTop: 24,
    padding: 14,
    background: '#F5F0E8',
    borderRadius: 10,
    fontSize: 12,
    color: '#8D6E63',
    lineHeight: 1.8,
    border: '1px dashed #D7C4A1',
  },
  hintTitle: {
    fontWeight: 600,
    color: '#5D4037',
    marginBottom: 4,
  },
  hintRow: {
    fontSize: 12,
  },
  decoration1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(184, 115, 51, 0.1) 0%, transparent 70%)',
  },
  decoration2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(215, 196, 161, 0.3) 0%, transparent 70%)',
  },
  decoration3: {
    position: 'absolute',
    bottom: 80,
    right: 120,
    width: 80,
    height: 80,
    background: '#D7C4A1',
    opacity: 0.2,
    transform: 'rotate(45deg)',
    borderRadius: 8,
  },
};

export default LoginPage;
