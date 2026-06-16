import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, NavLink, useLocation, useParams } from 'react-router-dom'
import { useTripStore } from './stores/tripStore'

import Dashboard from './components/Dashboard'
import TripWizard from './components/TripWizard'
import LuggageList from './components/LuggageList'
import StatsView from './components/StatsView'

const LuggageListWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  if (!id) return <div>未找到旅行ID</div>
  return <LuggageList tripId={id} />
}

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

const navItems = [
  { path: '/', label: '我的旅行', icon: '✈️' },
  { path: '/templates', label: '行李模板', icon: '📦' },
  { path: '/stats', label: '统计报告', icon: '📊' },
]

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🧳</div>
          <span>NomadNest</span>
        </div>
        <div className="user-profile">
          <div className="user-avatar">U</div>
          <div className="user-info">
            <span className="user-welcome">欢迎回来</span>
            <span className="user-name">旅行者</span>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

const AppContent: React.FC = () => {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const loadTrips = useTripStore((state) => state.loadTrips)

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  return (
    <div className="app-container">
      {!isMobile && <Sidebar />}
      <main className="main-content">
        <div className="page-wrapper">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trips/new" element={<TripWizard />} />
            <Route path="/trips/:id" element={<LuggageListWrapper />} />
            <Route path="/stats" element={<StatsView />} />
          </Routes>
        </div>
      </main>
      {isMobile && <BottomNav />}
    </div>
  )
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
