import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export default function Layout() {
  const navigate = useNavigate()
  const { initData, isLoading } = useAppStore()

  useEffect(() => {
    initData()
  }, [initData])

  const navItems = [
    { path: '/templates', label: '模板管理', icon: '📋' },
    { path: '/dashboard', label: '合同看板', icon: '📊' },
  ]

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-color)',
      }}>
        <div style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
        }}>
          加载中...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-color)',
    }}>
      <header style={{
        height: 'var(--header-height)',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--primary)',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}
          onClick={() => navigate('/templates')}
        >
          🏠 租赁管家
        </div>

        <nav style={{
          display: 'flex',
          gap: '4px',
          marginLeft: '32px',
          flex: 1,
        }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              })}
              onMouseEnter={(e) => {
                if (!(e.currentTarget.style.background === 'var(--primary-light)')) {
                  e.currentTarget.style.background = 'var(--bg-color)'
                }
              }}
              onMouseLeave={(e) => {
                if (!(e.currentTarget.style.background === 'var(--primary-light)')) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/contract/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>+</span>
          新建合同
        </button>
      </header>

      <main style={{
        flex: 1,
        overflow: 'auto',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
