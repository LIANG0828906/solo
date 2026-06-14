import { useState, useEffect, useCallback } from 'react'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import RankPage from './pages/RankPage'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/rank', label: '排行榜', icon: '🏆' },
]

function getRoute(): { page: string; id: string } {
  const hash = window.location.hash.slice(1) || '/'
  if (hash.startsWith('/recipe/')) {
    return { page: 'recipe', id: hash.replace('/recipe/', '') }
  }
  if (hash === '/rank') {
    return { page: 'rank', id: '' }
  }
  return { page: 'home', id: '' }
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((path: string) => {
    window.location.hash = path
    setMobileMenuOpen(false)
  }, [])

  return (
    <div style={styles.root}>
      <style>{globalCSS}</style>
      <nav style={styles.navbar}>
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => navigate('/')}>
            <span style={styles.logoIcon}>🍳</span>
            <span style={styles.logoText}>家庭菜谱</span>
          </div>
          <div style={styles.desktopNav}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.path}
                style={{
                  ...styles.navBtn,
                  ...(route.page === (item.path === '/' ? 'home' : item.path.slice(1)) ? styles.navBtnActive : {}),
                }}
                onClick={() => navigate(item.path)}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <button
            style={styles.hamburger}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>
        {mobileMenuOpen && (
          <div style={styles.mobileMenu}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.path}
                style={{
                  ...styles.mobileMenuBtn,
                  ...(route.page === (item.path === '/' ? 'home' : item.path.slice(1)) ? styles.navBtnActive : {}),
                }}
                onClick={() => navigate(item.path)}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>
      <main style={styles.main}>
        {route.page === 'home' && <HomePage navigate={navigate} />}
        {route.page === 'recipe' && <RecipePage recipeId={route.id} navigate={navigate} />}
        {route.page === 'rank' && <RankPage navigate={navigate} />}
      </main>
    </div>
  )
}

const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #FFF8F0;
    font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #4A3728;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3 { font-family: 'Noto Serif SC', serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D4A574; border-radius: 3px; }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  @keyframes commentFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
  },
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'rgba(255, 248, 240, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(212, 165, 116, 0.2)',
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: 22,
    fontWeight: 700,
    color: '#4A3728',
  },
  desktopNav: {
    display: 'flex',
    gap: 8,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 20px',
    border: 'none',
    borderRadius: 24,
    background: 'transparent',
    color: '#8B7355',
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Noto Sans SC', sans-serif",
  },
  navBtnActive: {
    background: 'rgba(212, 165, 116, 0.25)',
    color: '#4A3728',
    fontWeight: 500,
  },
  navIcon: {
    fontSize: 16,
  },
  hamburger: {
    display: 'none',
    border: 'none',
    background: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: '#4A3728',
  },
  mobileMenu: {
    padding: '8px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  mobileMenuBtn: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: 12,
    background: 'transparent',
    color: '#8B7355',
    fontSize: 16,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: "'Noto Sans SC', sans-serif",
  },
  main: {
    paddingTop: 64,
    minHeight: 'calc(100vh - 64px)',
  },
}

const mobileMediaQuery = `
  @media (max-width: 768px) {
    .desktop-nav-class { display: none !important; }
    .hamburger-class { display: block !important; }
  }
  @media (min-width: 769px) {
    .mobile-menu-class { display: none !important; }
  }
`
