import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/seats');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>📚 图书馆座位预约</h1>
        <p style={styles.subtitle}>欢迎回来，请登录您的账户</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={styles.footer}>
          还没有账户？
          <Link to="/register" style={styles.link}>
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px 30px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    textAlign: 'center',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: '30px',
  },
  error: {
    backgroundColor: '#FDEDED',
    color: 'var(--danger-color)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--primary-color)',
  },
  input: {
    width: '100%',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    marginTop: '10px',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#7F8C8D',
  },
  link: {
    color: 'var(--accent-color)',
    textDecoration: 'none',
    marginLeft: '4px',
  },
};

export default Login;
