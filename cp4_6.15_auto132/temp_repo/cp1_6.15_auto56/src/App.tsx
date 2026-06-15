import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Gallery from './pages/Gallery';
import Detail from './pages/Detail';
import Profile from './pages/Profile';
import { User } from './types';
import './styles/global.css';

function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('museum_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('museum_user');
    setUser(null);
  };

  return (
    <>
      <nav style={styles.nav}>
        <div className="container" style={styles.navInner}>
          <Link to="/" style={styles.logo}>
            <span style={styles.logoIcon}>🏛️</span>
            <span style={styles.logoText}>微缩景观博物馆</span>
          </Link>
          <div style={styles.navLinks}>
            <Link 
              to="/" 
              style={{
                ...styles.navLink,
                color: location.pathname === '/' ? 'var(--accent-gold)' : 'var(--text-primary)'
              }}
            >
              展览大厅
            </Link>
            {user ? (
              <>
                <Link 
                  to={`/profile/${user.id}`}
                  style={{
                    ...styles.navLink,
                    color: location.pathname.startsWith('/profile') ? 'var(--accent-gold)' : 'var(--text-primary)'
                  }}
                >
                  个人中心
                </Link>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  退出
                </button>
                <div style={styles.avatar}>
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)} style={styles.loginBtn}>
              登录/注册
            </button>
            )}
          </div>
        </div>
      </nav>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={setUser} />}
    </>
  );
}

function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: (user: User) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { username, password, nickname } : { username, password };
      const res = await fetch(`http://localhost:3002${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('museum_user', JSON.stringify(data.user));
        onLogin(data.user);
        onClose();
      } else {
        setError(data.message);
      }
    } catch {
      setError('网络错误，请稍后重试');
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose}>×</button>
        <h2 style={styles.modalTitle}>
          {isRegister ? '注册账号' : '登录'}
        </h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <div style={styles.formGroup}>
              <label style={styles.label}>昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                style={styles.input}
                placeholder="请输入昵称"
              />
            </div>
          )}
          <div style={styles.formGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={styles.input}
              placeholder="请输入用户名"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="请输入密码"
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '20px' }}>
            {isRegister ? '注册' : '登录'}
          </button>
        </form>
        <div style={styles.switchText}>
          {isRegister ? '已有账号？' : '还没有账号？'}
          <button onClick={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
            {isRegister ? '去登录' : '去注册'}
          </button>
        </div>
        <div style={styles.demoTip}>
          演示账号: demo / 123456
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(42, 42, 42, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  navInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--accent-gold)',
    letterSpacing: '0.5px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
  },
  navLink: {
    fontSize: '14px',
    fontWeight: 500,
    transition: 'color 0.2s',
    textDecoration: 'none',
  },
  loginBtn: {
    padding: '6px 18px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
    color: 'var(--bg-primary)',
    fontWeight: 600,
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  logoutBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    border: '1px solid var(--card-border)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--bg-primary)',
    fontWeight: 700,
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '32px',
    width: '400px',
    maxWidth: '90vw',
    position: 'relative',
    border: '1px solid var(--card-border)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '24px',
    color: 'var(--accent-gold)',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--card-border)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    color: 'var(--error)',
    fontSize: '13px',
    marginTop: '8px',
  },
  switchText: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-gold)',
    cursor: 'pointer',
    marginLeft: '6px',
    fontSize: '13px',
  },
  demoTip: {
    marginTop: '16px',
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
};

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Gallery />} />
            <Route path="/artwork/:id" element={<Detail />} />
            <Route path="/profile/:userId" element={<Profile />} />
          </Routes>
        </main>
        <footer style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', borderTop: '1px solid var(--card-border)' }}>
          <div className="container">
            © 2026 微缩景观博物馆 · 让每一件微缩作品都值得被珍藏
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
