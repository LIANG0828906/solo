import { useEffect, useRef } from 'react'
import { SceneManager } from './SceneManager'
import { useStore, Theme } from './store'

const THEME_LABELS: Record<Theme, string> = {
  stardust: '星尘',
  aurora: '极光',
  lava: '熔岩'
}

const THEME_ORDER: Theme[] = ['stardust', 'aurora', 'lava']

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)

  const theme = useStore((s) => s.theme)
  const particleSizeScale = useStore((s) => s.particleSizeScale)
  const discoveredCount = useStore((s) => s.discoveredCount)
  const selectedParticleId = useStore((s) => s.selectedParticleId)
  const particles = useStore((s) => s.particles)

  const setTheme = useStore((s) => s.setTheme)
  const setParticleSizeScale = useStore((s) => s.setParticleSizeScale)
  const selectParticle = useStore((s) => s.selectParticle)
  const resetCamera = useStore((s) => s.resetCamera)

  useEffect(() => {
    if (!canvasContainerRef.current) return
    const sm = new SceneManager(canvasContainerRef.current)
    sceneManagerRef.current = sm
    return () => {
      sm.dispose()
      sceneManagerRef.current = null
    }
  }, [])

  const selectedParticle = selectedParticleId !== null
    ? particles.find((p) => p.id === selectedParticleId)
    : null

  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(theme)
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length]
    setTheme(next)
  }

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    color: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '13px',
    width: '100%',
    transition: 'all 0.15s ease',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    outline: 'none'
  }

  const onBtnEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
  }
  const onBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'transparent'
  }
  const onBtnDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.95)'
  }
  const onBtnUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)'
  }

  const sliderPercent = ((particleSizeScale - 0.05) / (0.5 - 0.05)) * 100
  const sliderBg = `linear-gradient(to right, #4D96FF 0%, #4D96FF ${sliderPercent}%, rgba(255,255,255,0.15) ${sliderPercent}%, rgba(255,255,255,0.15) 100%)`

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div
        ref={canvasContainerRef}
        style={{ position: 'absolute', inset: 0 }}
      />

      <div
        style={{
          position: 'absolute',
          left: 40,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 220,
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 12,
          padding: 18,
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 13,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>
          星尘画廊
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ opacity: 0.7, fontSize: 12 }}>颜色主题</div>
          <button
            onClick={cycleTheme}
            style={btnStyle}
            onMouseEnter={onBtnEnter}
            onMouseLeave={onBtnLeave}
            onMouseDown={onBtnDown}
            onMouseUp={onBtnUp}
          >
            {THEME_LABELS[theme]}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ opacity: 0.7, fontSize: 12 }}>
            粒子大小：{particleSizeScale.toFixed(2)}
          </div>
          <input
            type="range"
            min={0.05}
            max={0.5}
            step={0.01}
            value={particleSizeScale}
            onChange={(e) => setParticleSizeScale(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: 4,
              background: sliderBg,
              borderRadius: 2,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
        </div>

        <button
          onClick={resetCamera}
          style={btnStyle}
          onMouseEnter={onBtnEnter}
          onMouseLeave={onBtnLeave}
          onMouseDown={onBtnDown}
          onMouseUp={onBtnUp}
        >
          重置视角
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          padding: '10px 18px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdrop