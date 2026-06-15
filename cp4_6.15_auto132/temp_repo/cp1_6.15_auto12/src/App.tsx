import { useState, useEffect } from 'react'
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

  const navigate = (path: string) => {
    window.location.hash = path
    setMobileMenuOpen(false)
  }

  const isActive = (itemPath: string) => {
    if (itemPath === '/') return route.page === 'home'
    return route.page === itemPath.slice(1)
  }

  return (
    <div className="app-root">
      <style>{appCSS}</style>
      <nav className="app-navbar">
        <div className="app-nav-inner">
          <div className="app-logo" onClick={() => navigate('/')}>
            <span className="app-logo-icon">🍳</span>
            <span className="app-logo-text">家庭菜谱</span>
          </div>
          <div className="app-desktop-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.path}
                className={`app-nav-btn ${isActive(item.path) ? 'app-nav-btn-active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="app-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <button
            className="app-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="app-mobile-menu">
            {NAV_ITEMS.map(item => (
              <button
                key={item.path}
                className={`app-mobile-menu-btn ${isActive(item.path) ? 'app-nav-btn-active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>
      <main className="app-main">
        {route.page === 'home' && <HomePage navigate={navigate} />}
        {route.page === 'recipe' && <RecipePage recipeId={route.id} navigate={navigate} />}
        {route.page === 'rank' && <RankPage navigate={navigate} />}
      </main>
    </div>
  )
}

const appCSS = `
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
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .app-root { min-height: 100vh; }

  .app-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(255, 248, 240, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(212, 165, 116, 0.2);
  }
  .app-nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .app-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }
  .app-logo-icon { font-size: 28px; }
  .app-logo-text {
    font-family: 'Noto Serif SC', serif;
    font-size: 22px;
    font-weight: 700;
    color: #4A3728;
  }
  .app-desktop-nav {
    display: flex;
    gap: 8px;
  }
  .app-nav-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    border: none;
    border-radius: 24px;
    background: transparent;
    color: #8B7355;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Noto Sans SC', sans-serif;
  }
  .app-nav-btn-active {
    background: rgba(212, 165, 116, 0.25);
    color: #4A3728;
    font-weight: 500;
  }
  .app-nav-icon { font-size: 16px; }
  .app-hamburger {
    display: none;
    border: none;
    background: none;
    font-size: 22px;
    cursor: pointer;
    color: #4A3728;
    padding: 4px 8px;
  }
  .app-mobile-menu {
    padding: 4px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .app-mobile-menu-btn {
    padding: 12px 16px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: #8B7355;
    font-size: 16px;
    text-align: left;
    cursor: pointer;
    font-family: 'Noto Sans SC', sans-serif;
  }
  .app-main {
    padding-top: 64px;
    min-height: calc(100vh - 64px);
  }

  @media (max-width: 768px) {
    .app-desktop-nav { display: none !important; }
    .app-hamburger { display: block !important; }
  }
`
