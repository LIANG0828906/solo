import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const Borrow = lazy(() => import('./pages/Borrow'))

const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.8)',
  fontSize: '16px',
  fontWeight: isActive ? 600 : 400,
  textDecoration: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
  transition: 'all 0.3s ease',
})

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()

  return (
    <div
      key={location.pathname}
      style={{
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      {children}
    </div>
  )
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F7FA' }}>
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            邻里帮手
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <NavLink to="/" end style={navLinkStyle}>
              物品列表
            </NavLink>
            <NavLink to="/borrow" style={navLinkStyle}>
              我的借用
            </NavLink>
          </div>
        </nav>

        <main
          style={{
            paddingTop: '60px',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '24px',
            }}
          >
            <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>}>
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/borrow" element={<Borrow />} />
                </Routes>
              </PageTransition>
            </Suspense>
          </div>
        </main>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </BrowserRouter>
  )
}

export default App
