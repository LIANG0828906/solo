import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Home from '@pages/Home'
import WeddingPlan from '@pages/WeddingPlan'
import GuestList from '@pages/GuestList'
import Invitation from '@pages/Invitation'
import { AppProvider, useApp } from './context/AppContext'

function NavBar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { wedding, currentUser, loading } = useApp()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { path: '/', label: '仪表盘', icon: '🏠' },
    { path: '/plan', label: '婚礼流程', icon: '📅' },
    { path: '/guests', label: '宾客管理', icon: '👥' },
    { path: '/invitation', label: '电子请柬', icon: '💌' },
  ]

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(10px)',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(10px)',
          background: scrolled
            ? 'rgba(250, 218, 221, 0.85)'
            : 'rgba(255, 255, 255, 0.3)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          borderBottom: scrolled
            ? '1px solid rgba(232, 168, 184, 0.2)'
            : '1px solid transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E8A8B8, #F7E7CE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 4px 12px rgba(232, 168, 184, 0.3)',
            }}
          >
            💍
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #E8A8B8, #D4AF37)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 1,
              }}
            >
              挚爱婚礼
            </h1>
            {!loading && wedding && (
              <p style={{ fontSize: 11, color: '#9B8B85', marginTop: -2 }}>
                {wedding.groomName} & {wedding.brideName}
              </p>
            )}
          </div>
        </div>

        <div
          className="nav-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '6px',
            borderRadius: 14,
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                padding: '10px 18px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? '#6B5B55' : '#9B8B85',
                background: isActive
                  ? 'linear-gradient(135deg, #FADADD, #F7E7CE)'
                  : 'transparent',
                boxShadow: isActive ? '0 2px 8px rgba(232, 168, 184, 0.2)' : 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: 30,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FADADD, #E8A8B8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              {currentUser.avatar}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6B5B55' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: 10, color: '#9B8B85' }}>
                {currentUser.role === 'bride' ? '新娘' : currentUser.role === 'groom' ? '新郎' : '策划师'}
              </span>
            </div>
          </div>

          <button
            className="nav-mobile-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              width: 42,
              height: 42,
              borderRadius: 12,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="nav-mobile-overlay"
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(107, 91, 85, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 49,
            animation: 'fadeIn 0.3s ease',
          }}
        />
      )}

      <div
        className="nav-mobile-menu"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '75%',
          maxWidth: 300,
          background: 'linear-gradient(180deg, #FADADD 0%, #F7E7CE 100%)',
          zIndex: 51,
          padding: '100px 24px 24px',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '4px 0 32px rgba(107, 91, 85, 0.2)',
        }}
      >
        {navItems.map((item, idx) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 20px',
              borderRadius: 14,
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 500,
              marginBottom: 8,
              color: isActive ? '#6B5B55' : '#9B8B85',
              background: isActive ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
              animation: `slideInLeft 0.4s ease ${idx * 0.05}s both`,
            })}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; align-items: center; justify-content: center; }
          .nav-mobile-menu { display: block !important; }
        }
      `}</style>
    </>
  )
}

function MainContent() {
  return (
    <div
      style={{
        paddingTop: 92,
        minHeight: '100vh',
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<WeddingPlan />} />
        <Route path="/guests" element={<GuestList />} />
        <Route path="/invitation" element={<Invitation />} />
      </Routes>
    </div>
  )
}

function AppContent() {
  return (
    <>
      <NavBar />
      <MainContent />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  )
}
