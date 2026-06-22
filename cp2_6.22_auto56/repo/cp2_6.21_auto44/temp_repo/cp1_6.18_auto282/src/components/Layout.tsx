import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useReportStore } from '../store'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toast = useReportStore(state => state.toast)
  const location = useLocation()

  const isAdminPage = location.pathname === '/admin'

  const navItems = [
    { to: '/', label: '首页', icon: '🏠' },
    { to: '/submit', label: '上报', icon: '📝' },
    { to: '/admin', label: '管理', icon: '⚙️' }
  ]

  return (
    <div className="app">
      <button
        className="hamburger"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="切换菜单"
      >
        ☰
      </button>

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">社区设施上报</div>
        <div className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="content">
        <Outlet />
      </main>

      {toast && <div className="toast">{toast}</div>}

      {sidebarOpen && !isAdminPage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 999
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout
