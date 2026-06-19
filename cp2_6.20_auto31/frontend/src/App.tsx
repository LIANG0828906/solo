import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const BACKGROUND_COLOR = '#1a1a2e'
const CARD_COLOR = '#16213e'
const PRIMARY_COLOR = '#e94560'

const CollectionPage = () => (
  <div style={pageStyle}>
    <div style={cardStyle}>
      <h2 style={headingStyle}>收藏</h2>
      <p style={textStyle}>这里是收藏页面内容</p>
    </div>
  </div>
)

const ProfilePage = () => (
  <div style={pageStyle}>
    <div style={cardStyle}>
      <h2 style={headingStyle}>个人资料</h2>
      <p style={textStyle}>这里是个人资料页面内容</p>
    </div>
  </div>
)

const CommunityPage = () => (
  <div style={pageStyle}>
    <div style={cardStyle}>
      <h2 style={headingStyle}>社区</h2>
      <p style={textStyle}>这里是社区页面内容</p>
    </div>
  </div>
)

const pageStyle: React.CSSProperties = {
  padding: '100px 24px 24px',
  minHeight: '100vh',
  backgroundColor: BACKGROUND_COLOR,
  color: '#fff',
}

const cardStyle: React.CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '32px',
  backgroundColor: CARD_COLOR,
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
}

const headingStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  color: PRIMARY_COLOR,
  fontSize: '24px',
}

const textStyle: React.CSSProperties = {
  margin: 0,
  color: 'rgba(255, 255, 255, 0.8)',
  lineHeight: 1.6,
}

const navItems = [
  { to: '/collection', label: '收藏' },
  { to: '/profile', label: '个人资料' },
  { to: '/community', label: '社区' },
]

function AnimatedRoutes() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  useEffect(() => {
    if (transitionStage === 'fadeOut') {
      const timeout = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('fadeIn')
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [transitionStage, location])

  return (
    <div
      style={{
        ...transitionStyles,
        opacity: transitionStage === 'fadeIn' ? 1 : 0,
      }}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<Navigate to="/collection" replace />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/community" element={<CommunityPage />} />
      </Routes>
    </div>
  )
}

const transitionStyles: React.CSSProperties = {
  transition: 'opacity 0.3s ease-in-out',
}

function Navbar() {
  const location = useLocation()
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => item.to === location.pathname)
    if (activeIndex >= 0) {
      const navItemsElements = document.querySelectorAll('[data-nav-item]')
      const activeElement = navItemsElements[activeIndex] as HTMLElement | undefined
      if (activeElement) {
        const rect = activeElement.getBoundingClientRect()
        const parentRect = activeElement.parentElement?.getBoundingClientRect()
        if (parentRect) {
          setIndicatorStyle({
            left: `${rect.left - parentRect.left}px`,
            width: `${rect.width}px`,
            opacity: 1,
          })
        }
      }
    }
  }, [location.pathname])

  return (
    <nav style={navbarStyle}>
      <div style={navContainerStyle}>
        <div style={logoStyle}>Auto31</div>
        <div style={navLinksWrapperStyle}>
          <div style={navLinksStyle}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-nav-item
                style={({ isActive }) => ({
                  ...navLinkStyle,
                  color: isActive ? PRIMARY_COLOR : 'rgba(255, 255, 255, 0.7)',
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div style={{ ...indicatorBaseStyle, ...indicatorStyle }} />
        </div>
      </div>
    </nav>
  )
}

const navbarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: 'rgba(22, 33, 62, 0.8)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(233, 69, 96, 0.2)',
}

const navContainerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 24px',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const logoStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: PRIMARY_COLOR,
  letterSpacing: '0.5px',
}

const navLinksWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
}

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
}

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 500,
  padding: '8px 4px',
  transition: 'color 0.2s ease',
}

const indicatorBaseStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-2px',
  height: '2px',
  backgroundColor: PRIMARY_COLOR,
  borderRadius: '2px',
  transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 0,
}

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: BACKGROUND_COLOR }}>
      <Navbar />
      <AnimatedRoutes />
    </div>
  )
}

export default App
