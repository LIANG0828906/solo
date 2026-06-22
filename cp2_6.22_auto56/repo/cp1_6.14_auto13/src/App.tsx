import { Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Detail from './pages/Detail'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import { authApi, User } from './api'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.me()
        .then(data => {
          setUser(data.user)
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>加载中...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAuthPage && (
        <header style={styles.header}>
          <div className="container" style={styles.headerInner}>
            <Link to="/" style={styles.logo}>
              <span style={{ fontSize: '28px' }}>🏠</span>
              <span style={styles.logoText}>旧物新语</span>
            </Link>
            <nav style={styles.nav}>
              <Link to="/" style={styles.navLink}>
                <span style={{ marginRight: '6px' }}>🏡</span> 广场
              </Link>
              {user ? (
                <>
                  <Link to="/profile" style={styles.navLink}>
                    <span style={{ marginRight: '6px' }}>👤</span> {user.nickname}
                  </Link>
                  <button onClick={handleLogout} style={{ ...styles.navLink, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span style={{ marginRight: '6px' }}>🚪</span> 退出
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" style={styles.navLink}>登录</Link>
                  <Link to="/register" style={{ ...styles.navLink, ...styles.navButton }}>注册</Link>
                </>
              )}
            </nav>
          </div>
        </header>
      )}

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/item/:id" element={<Detail user={user} />} />
          <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!isAuthPage && (
        <footer style={styles.footer}>
          <div className="container" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>🏠 旧物新语 · 让每一件旧物都带着故事继续温暖</p>
          </div>
        </footer>
      )}
    </div>
  )
}

const styles = {
  header: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-light)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: 'var(--warm-brown)'
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  navLink: {
    padding: '8px 16px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },
  navButton: {
    background: 'var(--warm-coffee)',
    color: 'white',
    padding: '8px 20px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500
  }
}

export default App
