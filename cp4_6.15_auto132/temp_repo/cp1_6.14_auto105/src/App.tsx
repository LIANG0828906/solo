import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import MapPage from '@/pages/MapPage'
import StatsPage from '@/pages/StatsPage'

function App() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('enter')

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('exit')
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('enter')
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [location, displayLocation])

  return (
    <div className="app-container">
      <Navbar />
      <div
        className={`page-content page-transition-${transitionStage} page-transition-${transitionStage}-active`}
      >
        <Routes location={displayLocation}>
          <Route path="/" element={<MapPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
