import { useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore, STATUS_LABELS } from '@/store'
import CustomerView from '@/pages/CustomerView'
import WorkshopDashboard from '@/pages/WorkshopDashboard'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    activeNav,
    sidebarOpen,
    warningCount,
    toasts,
    setActiveNav,
    toggleSidebar,
    setSidebarOpen,
    removeToast,
  } = useAppStore()

  useEffect(() => {
    const path = location.pathname
    if (path === '/customer' || path === '/') setActiveNav('customer')
    else if (path === '/dashboard') setActiveNav('dashboard')
    else if (path === '/materials') setActiveNav('materials')
  }, [location.pathname, setActiveNav])

  const navItems = [
    { key: 'customer', label: '浏览定制', icon: '🛒', path: '/customer' },
    { key: 'dashboard', label: '订单管理', icon: '📋', path: '/dashboard' },
    { key: 'materials', label: '库存预警', icon: '⚠️', path: '/materials', badge: warningCount },
  ]

  const handleNav = useCallback(
    (key: string, path: string) => {
      setActiveNav(key)
      navigate(path)
    },
    [setActiveNav, navigate]
  )

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const ripple = document.createElement('span')
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    ripple.className = 'ripple-effect'
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 200)
  }

  return (
    <div className="app-layout">
      <button
        className="hamburger"
        onClick={toggleSidebar}
        onMouseUp={createRipple}
        aria-label="菜单"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 90,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">🏺</span>
            <div>
              <div style={{ fontSize: 16 }}>陶然工坊</div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>
                Pottery Studio
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activeNav === item.key ? 'active' : ''}`}
              onClick={() => handleNav(item.key, item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: 4 }}>陶然工坊 v1.0.0</div>
          <div style={{ opacity: 0.5 }}>© 2025 匠心手作</div>
        </div>
      </aside>

      <main className="main-content" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Navigate to="/customer" replace />} />
          <Route path="/customer" element={<CustomerView />} />
          <Route path="/dashboard" element={<WorkshopDashboard tab="orders" />} />
          <Route path="/materials" element={<WorkshopDashboard tab="materials" />} />
          <Route path="*" element={<Navigate to="/customer" replace />} />
        </Routes>
      </main>

      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
              <span style={{ fontSize: 18 }}>
                {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
              </span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
