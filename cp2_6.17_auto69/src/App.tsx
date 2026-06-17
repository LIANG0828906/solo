import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { RefreshCw, Maximize, Minimize } from 'lucide-react'
import StarField from './components/StarField'
import SceneManager from './interaction/SceneManager'
import UIPanel from './interaction/UIPanel'
import { useSimulationStore } from './store/store'
import './index.css'

function NavigationBar() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { resetSimulation } = useSimulationStore()

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
      style={{
        height: '60px',
        backgroundColor: 'rgba(10, 10, 26, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #00E5FF',
        boxShadow: '0 2px 20px rgba(0, 229, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="text-2xl font-bold tracking-wider"
          style={{ color: '#00E5FF', fontFamily: 'Inter, sans-serif' }}
        >
          FusionSim
        </div>
        <span className="text-xs text-gray-500 hidden sm:block">等离子体核聚变模拟</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={resetSimulation}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:brightness-110"
          style={{
            width: '100px',
            height: '36px',
            backgroundColor: '#FF3366',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FF6699'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FF3366'
          }}
        >
          <RefreshCw size={16} />
          <span className="text-sm">重启</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="relative flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-gray-700"
          style={{
            width: '36px',
            height: '36px',
            color: '#B0B0B0',
          }}
          title={isFullscreen ? '退出全屏' : '全屏模式'}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </nav>
  )
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div
              ref={containerRef}
              className="fixed inset-0 overflow-hidden"
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
            >
              <StarField />

              <div className="fixed inset-0" style={{ zIndex: 1 }}>
                <Canvas
                  camera={{
                    position: [0, 5, 15],
                    fov: 60,
                    near: 0.1,
                    far: 1000,
                  }}
                  gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                  }}
                  style={{ background: 'transparent' }}
                >
                  <SceneManager />
                </Canvas>
              </div>

              <NavigationBar />

              <div style={{ zIndex: 100 }}>
                <UIPanel />
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  )
}
