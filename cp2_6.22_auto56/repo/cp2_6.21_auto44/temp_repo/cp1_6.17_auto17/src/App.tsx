import { useState, useEffect, useRef } from 'react'
import './App.css'
import CameraModule from './modules/camera/CameraModule'
import TextureModule from './modules/texture/TextureModule'
import { useStore } from './store'
import type { WrinkleStats } from './types'

function AnimatedStatValue({ value, format }: { value: number | string; format?: (v: number) => string }) {
  const [isAnimating, setIsAnimating] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 100)
      prevValueRef.current = value
      return () => clearTimeout(timer)
    }
  }, [value])

  const displayValue = typeof value === 'number' && format ? format(value) : value

  return (
    <span
      style={{
        color: '#0D47A1',
        fontSize: 16,
        fontWeight: 600,
        transition: 'opacity 0.1s ease, transform 0.1s ease',
        opacity: isAnimating ? 0.6 : 1,
        transform: isAnimating ? 'scale(1.08)' : 'scale(1)',
        display: 'inline-block',
      }}
    >
      {displayValue}
    </span>
  )
}

function AnimatedCoordValue({ x, y }: { x: number; y: number }) {
  const [isAnimating, setIsAnimating] = useState(false)
  const prevXRef = useRef(x)
  const prevYRef = useRef(y)

  useEffect(() => {
    if (prevXRef.current !== x || prevYRef.current !== y) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 100)
      prevXRef.current = x
      prevYRef.current = y
      return () => clearTimeout(timer)
    }
  }, [x, y])

  return (
    <span
      style={{
        color: '#0D47A1',
        fontSize: 16,
        fontWeight: 600,
        transition: 'opacity 0.1s ease, transform 0.1s ease',
        opacity: isAnimating ? 0.6 : 1,
        transform: isAnimating ? 'scale(1.08)' : 'scale(1)',
        display: 'inline-block',
      }}
    >
      ({x}, {y})
    </span>
  )
}

function StatsPanel({ stats }: { stats: WrinkleStats }) {
  return (
    <div style={styles.statsPanel}>
      <div style={styles.statItem}>
        <span style={styles.statLabel}>平均褶皱强度:</span>
        <AnimatedStatValue value={stats.averageIntensity} format={(v) => `${v.toFixed(1)}%`} />
      </div>
      <div style={styles.statItem}>
        <span style={styles.statLabel}>最大褶皱区域:</span>
        <AnimatedCoordValue x={stats.maxWrinkleX} y={stats.maxWrinkleY} />
      </div>
    </div>
  )
}

function App() {
  const { stats } = useStore()

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">纸张褶皱检测器</h1>
        <p className="app-subtitle">实时检测纸张表面褶皱并生成热力图</p>
      </header>

      <div className="main-layout">
        <div className="left-panel">
          <CameraModule />
          <StatsPanel stats={stats} />
        </div>

        <div className="divider" />

        <div className="right-panel">
          <TextureModule />
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  statsPanel: {
    width: 640,
    maxWidth: '100%',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '2px solid #424242',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#546E7A',
    fontSize: 14,
    fontWeight: 500,
  },
}

export default App
