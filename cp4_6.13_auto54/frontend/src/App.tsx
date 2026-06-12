import { useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Space from './pages/Space'
import Community from './pages/Community'
import { useAppStore } from './store'
import { playClickSound } from './utils/audio'

const navStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  padding: '10px 22px',
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '15px',
  transition: 'all 0.25s ease',
  background: isActive ? 'linear-gradient(135deg, #FFD93D, #FF8C69)' : 'rgba(255,255,255,0.7)',
  color: isActive ? '#fff' : '#5D4037',
  boxShadow: isActive ? '0 6px 16px rgba(255,140,105,0.4)' : '0 2px 8px rgba(0,0,0,0.06)',
  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
})

export default function App() {
  const location = useLocation()
  const initUser = useAppStore(s => s.initUser)

  useEffect(() => {
    initUser()
  }, [initUser])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FFF8E7 0%, #FFECD2 100%)',
      paddingBottom: '100px',
    }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        background: 'rgba(255,248,231,0.85)',
        borderBottom: '2px solid rgba(255,217,61,0.3)',
        padding: '14px 24px',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <NavLink to="/" onClick={() => playClickSound()} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 34 }}>🐾</span>
            <div>
              <div style={{
                fontSize: 22,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FF8C69, #FF6B3D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>
                萌萌像素宠物屋
              </div>
              <div style={{ fontSize: 11, color: '#8D6E63', fontWeight: 600, marginTop: 2 }}>
                Pixel Pet Adoption Home
              </div>
            </div>
          </NavLink>

          <nav style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <NavLink to="/" end style={navStyle} onClick={() => playClickSound()}>
              🏠 收容所
            </NavLink>
            <NavLink to="/space" style={navStyle} onClick={() => playClickSound()}>
              💖 我的空间
            </NavLink>
            <NavLink to="/community" style={navStyle} onClick={() => playClickSound()}>
              📢 公告栏
            </NavLink>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/space" element={<Space />} />
          <Route path="/community" element={<Community />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <MobileNav />
    </div>
  )
}

function MobileNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: 'none',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '2px solid rgba(255,217,61,0.3)',
      padding: '8px 12px calc(8px + env(safe-area-inset-bottom))',
      justifyContent: 'space-around',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      '@media max-width 768px': { display: 'flex' } as React.CSSProperties,
    }}>
      <style>{`
        @media (max-width: 768px) {
          nav.mobile-nav { display: flex !important; }
          header > div > nav { display: none !important; }
        }
      `}</style>
      <div className="mobile-nav" style={{ display: 'none', width: '100%', justifyContent: 'space-around' }}>
        <NavLink to="/" end style={mobileBtn} onClick={() => playClickSound()}>🏠<br/>收容所</NavLink>
        <NavLink to="/space" style={mobileBtn} onClick={() => playClickSound()}>💖<br/>空间</NavLink>
        <NavLink to="/community" style={mobileBtn} onClick={() => playClickSound()}>📢<br/>公告栏</NavLink>
      </div>
    </nav>
  )
}

const mobileBtn: React.CSSProperties = {
  flex: 1,
  textAlign: 'center',
  padding: '6px 4px',
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 12,
  color: '#5D4037',
}
