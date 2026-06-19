import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import PetPage from './pages/PetPage'
import GardenPage from './pages/GardenPage'
import ShopPage from './pages/ShopPage'
import LeaderboardPage from './pages/LeaderboardPage'
import useUserStore from './modules/user/UserStore'

const navItems = [
  { path: '/home', label: '主页', icon: '🏠' },
  { path: '/pet', label: '宠物', icon: '🐾' },
  { path: '/garden', label: '花园', icon: '🌳' },
  { path: '/shop', label: '商店', icon: '🛒' },
  { path: '/leaderboard', label: '排行', icon: '🏆' },
]

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const fetchUser = useUserStore((s) => s.fetchUser)
  const initSocket = useUserStore((s) => s.initSocket)
  const disconnectSocket = useUserStore((s) => s.disconnectSocket)
  const user = useUserStore((s) => s.user)
  const [activeWave, setActiveWave] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
    initSocket()
    return () => disconnectSocket()
  }, [])

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/home')
    }
  }, [location, navigate])

  const handleNavClick = (path: string) => {
    setActiveWave(path)
    setTimeout(() => setActiveWave(null), 600)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: 80,
    }}>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌸</span>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>萌宠花园</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,215,0,0.15)', padding: '6px 12px', borderRadius: 20 }}>
              <span>💰</span>
              <span style={{ fontWeight: 600, color: '#b8860b' }}>{user.coins}</span>
            </div>
          )}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-orange))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: 'white',
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main style={{ flex: 1, padding: '20px 16px', maxWidth: 900, width: '100%', margin: '0 auto' }}>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/pet" element={<PetPage />} />
          <Route path="/garden" element={<GardenPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </main>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0 12px',
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.3)',
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => handleNavClick(item.path)}
            style={({ isActive }) => ({
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 14px',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-orange)' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 400,
              fontSize: 11,
              transition: 'all 0.3s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && activeWave === item.path && (
                  <span className="wave-effect" style={{ width: 20 }} />
                )}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: -4,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--accent-orange)',
                  }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default App
