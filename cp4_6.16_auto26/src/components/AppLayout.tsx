import { useEffect, ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store'

interface AppLayoutProps {
  children: ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { hydrate, isLoaded, ui, setMobileMenuOpen } = useStore()
  const location = useLocation()

  useEffect(() => {
    if (!isLoaded) {
      hydrate()
    }
  }, [hydrate, isLoaded])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location, setMobileMenuOpen])

  const navItems = [
    { to: '/', label: '仪表板', icon: 'fa-gauge-high' },
    { to: '/services', label: '服务管理', icon: 'fa-list-check' },
    { to: '/charts', label: '统计分析', icon: 'fa-chart-line' }
  ]

  const handleBackdropClick = () => {
    setMobileMenuOpen(false)
  }

  const handleHamburgerClick = () => {
    setMobileMenuOpen(!ui.isMobileMenuOpen)
  }

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <i className="fas fa-spinner fa-spin fa-3x" style={{ color: 'var(--accent-secondary)', marginBottom: 16 }}></i>
          <div>加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={handleHamburgerClick}>
          <i className={`fas ${ui.isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        <div className="mobile-logo">
          <i className="fas fa-credit-card"></i>
          SaaS 管家
        </div>
        <div style={{ width: 36 }}></div>
      </div>

      <div
        className={`backdrop ${ui.isMobileMenuOpen ? 'active' : ''}`}
        onClick={handleBackdropClick}
      ></div>

      <aside className={`sidebar ${ui.isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <i className="fas fa-credit-card"></i>
          SaaS 管家
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <i className="fas fa-shield-halved"></i> 数据本地加密存储
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppLayout
