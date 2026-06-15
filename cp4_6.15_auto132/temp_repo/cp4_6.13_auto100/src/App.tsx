import { useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from './store'
import ParticleClock from './ParticleClock'
import ThemeSelector from './ThemeSelector'
import TimePicker from './TimePicker'
import './styles.css'

function SettingsPanel() {
  const isOpen = useStore((state) => state.isSettingsOpen)
  const density = useStore((state) => state.density)
  const speed = useStore((state) => state.speed)
  const background = useStore((state) => state.background)
  const setDensity = useStore((state) => state.setDensity)
  const setSpeed = useStore((state) => state.setSpeed)
  const setBackground = useStore((state) => state.setBackground)

  if (!isOpen) return null

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-label">粒子密度</div>
        <div className="settings-value">{density} 个</div>
        <input
          type="range"
          min={100}
          max={500}
          step={10}
          value={density}
          onChange={(e) => setDensity(Number(e.target.value))}
          className="slider"
        />
      </div>
      <div className="settings-section">
        <div className="settings-label">运动速度</div>
        <div className="speed-buttons">
          {(['slow', 'medium', 'fast'] as const).map((s) => (
            <button
              key={s}
              className={`speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s === 'slow' ? '慢' : s === 'medium' ? '中' : '快'}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-section">
        <div className="settings-label">背景模式</div>
        <div className="bg-buttons">
          <button
            className={`bg-btn ${background === 'black' ? 'active' : ''}`}
            onClick={() => setBackground('black')}
          >
            <div className="bg-preview black" />
            纯黑
          </button>
          <button
            className={`bg-btn ${background === 'dark' ? 'active' : ''}`}
            onClick={() => setBackground('dark')}
          >
            <div className="bg-preview dark" />
            深灰
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingsButton() {
  const toggleSettings = useStore((state) => state.toggleSettings)
  const isSettingsOpen = useStore((state) => state.isSettingsOpen)

  return (
    <div
      className="settings-button glass"
      onClick={toggleSettings}
      title="设置"
    >
      {isSettingsOpen ? '✕' : '⚙'}
    </div>
  )
}

function ClockCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const toggleTimePicker = useStore((state) => state.toggleTimePicker)

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const centerY = rect.height / 2
    const clickY = e.clientY - rect.top
    const isCenterClick = Math.abs(clickY - centerY) < rect.height * 0.35

    if (isCenterClick) {
      toggleTimePicker()
    }
  }

  return (
    <div className="canvas-container" ref={canvasRef} onClick={handleCanvasClick}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{
          position: [0, 0, 300],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        dpr={[1, 2]}
      >
        <ParticleClock />
      </Canvas>
    </div>
  )
}

export default function App() {
  const background = useStore((state) => state.background)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`app-container bg-${background}`}>
      <ClockCanvas />
      <SettingsButton />
      <SettingsPanel />
      <ThemeSelector />
      <TimePicker />
      <div 
        className="hint-text"
        style={{ opacity: showHint ? 1 : 0 }}
      >
        点击中央区域设置时间
      </div>
    </div>
  )
}
