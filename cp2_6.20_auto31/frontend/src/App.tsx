import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import CollectionPage from './pages/CollectionPage'
import CommunityPage from './pages/CommunityPage'
import ProfilePage from './pages/ProfilePage'

const BACKGROUND_COLOR = '#1a1a2e'

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
        transition: 'opacity 0.3s ease-in-out',
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



function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: BACKGROUND_COLOR }}>
      <Navbar />
      <AnimatedRoutes />
    </div>
  )
}

export default App
