import { NavLink, useLocation } from 'react-router-dom'
import { useGameStore } from '../store'

const Navbar = () => {
  const location = useLocation()
  const balance = useGameStore((s) => s.player.balance)

  const tabs = [
    { path: '/', label: '收藏品', icon: '💎' },
    { path: '/market', label: '市场', icon: '🛒' },
    { path: '/backpack', label: '背包', icon: '🎒' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <nav
        className="desktop-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: '#16162A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🌌</span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00D4AA, #009FCC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              数字奇境
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {tabs.map((tab) => {
              const active = isActive(tab.path)
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  style={{
                    position: 'relative',
                    padding: '8px 20px',
                    color: active ? '#00D4AA' : 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {active && (
                    <span
                      className="tab-underline"
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        left: '10%',
                        right: '10%',
                        height: 3,
                        background: 'linear-gradient(90deg, #00D4AA, #009FCC)',
                        borderRadius: 2,
                      }}
                    />
                  )}
                </NavLink>
              )
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'rgba(255, 215, 0, 0.1)',
              borderRadius: 20,
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            <span>🪙</span>
            <span style={{ color: '#FFD700', fontWeight: 600, fontSize: 14 }}>{balance}</span>
          </div>
        </div>
      </nav>

      <nav
        className="mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 65,
          background: '#16162A',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 100,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                color: active ? '#00D4AA' : 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
                fontSize: 11,
                height: '100%',
              }}
            >
              <span style={{ fontSize: 22 }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '30%',
                    right: '30%',
                    height: 3,
                    background: 'linear-gradient(90deg, #00D4AA, #009FCC)',
                    borderRadius: '0 0 2px 2px',
                  }}
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}

export default Navbar
