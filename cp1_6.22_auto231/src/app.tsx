import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Animals from './pages/Animals'
import Applications from './pages/Applications'
import Followups from './pages/Followups'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'animals':
        return <Animals />
      case 'applications':
        return <Applications />
      case 'followups':
        return <Followups />
      default:
        return <Dashboard />
    }
  }

  return (
    <div style={appStyle}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main style={{
        ...mainStyle,
        marginLeft: isMobile ? 0 : '260px',
        paddingBottom: isMobile ? '80px' : 0
      }}>
        {renderPage()}
      </main>
    </div>
  )
}

const appStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#F8FAFC',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
}

const mainStyle: React.CSSProperties = {
  minHeight: '100vh',
  transition: 'margin-left 0.3s ease'
}

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(<App />)
}
