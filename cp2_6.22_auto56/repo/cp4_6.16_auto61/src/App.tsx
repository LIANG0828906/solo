import React from 'react'
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import ExhibitionModule from './layout/ExhibitionModule'
import ArtworkModule from './layout/ArtworkModule'
import useStore from './store/useStore'
import { useMemo } from 'react'

const Sidebar: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { to: '/exhibitions', label: '展览策划', icon: '◎' },
    { to: '/artworks', label: '作品库', icon: '▢' }
  ]

  return (
    <>
      <aside
        className="sidebar-desktop"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 72,
          background: 'rgba(26, 26, 62, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 0'
        }}
      >
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #D4A05A 0%, #E4B068 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1A1A3E',
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 36
        }}>
          C
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  background: isActive ? 'rgba(212, 160, 90, 0.2)' : 'transparent',
                  color: isActive ? '#D4A05A' : 'rgba(248, 244, 236, 0.6)',
                  transition: 'all 0.25s var(--ease-standard)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!location.pathname.startsWith(item.to)) {
                    e.currentTarget.style.background = 'rgba(248, 244, 236, 0.08)'
                    e.currentTarget.style.color = 'rgba(248, 244, 236, 0.9)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!location.pathname.startsWith(item.to)) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(248, 244, 236, 0.6)'
                  }
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 9, letterSpacing: '0.04em' }}>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B7EC8 0%, #6B8DD6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 14,
          fontWeight: 600
        }}>
          策
        </div>
      </aside>

      <nav
        className="bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 68,
          background: 'rgba(26, 26, 62, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 100,
          padding: '0 24px',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}
      >
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                color: isActive ? '#D4A05A' : 'rgba(248, 244, 236, 0.5)',
                textDecoration: 'none',
                transition: 'all 0.2s var(--ease-standard)'
              }}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11, letterSpacing: '0.03em' }}>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

const App: React.FC = () => {
  const { artworks, exhibitions } = useStore()

  useMemo(() => ({
    totalArtworks: artworks.length,
    inStockCount: artworks.filter(a => a.status === 'in_stock').length,
    lentOutCount: artworks.filter(a => a.status === 'lent_out').length,
    exhibitionCount: exhibitions.length
  }), [artworks, exhibitions])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-warm-white)' }}>
      <Sidebar />
      <main style={{ marginLeft: 72, minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/exhibitions" replace />} />
          <Route path="/exhibitions" element={<ExhibitionModule />} />
          <Route path="/exhibitions/:id" element={<ExhibitionModule />} />
          <Route path="/artworks" element={<ArtworkModule />} />
          <Route path="/artworks/:id" element={<ArtworkModule />} />
          <Route path="*" element={<Navigate to="/exhibitions" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
