import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../modules/auth/useAuthStore'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#1A1A1A',
          letterSpacing: '-0.5px',
        }}
      >
        <span style={{ fontSize: '28px' }}>🎨</span>
        <span>ArtVault</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          to="/galleries"
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            color: '#444',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          展厅广场
        </Link>

        {isAuthenticated ? (
          <>
            <Link
              to="/profile"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                color: '#444',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              个人中心
            </Link>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                background: 'rgba(99, 102, 241, 0.08)',
                borderRadius: '100px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                {user?.username}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                color: '#666',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                e.currentTarget.style.color = '#1A1A1A'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#666'
              }}
            >
              退出
            </button>
          </>
        ) : (
          <>
            <Link
              to="/auth?mode=login"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                color: '#444',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              登录
            </Link>
            <Link
              to="/auth?mode=register"
              style={{
                padding: '10px 22px',
                borderRadius: '100px',
                background: '#1A1A1A',
                color: '#fff',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#333'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1A1A1A'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              注册
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
