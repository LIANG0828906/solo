import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import {
  GRID_COLS,
  GRID_ROWS,
  HEX_SIZE,
  ArmorType,
  PATH_COORDS,
} from '@/game/types'
import {
  axialToPixel,
  getGridBounds,
  getPathPosition,
} from '@/game/physics'
import Grid from '@/components/Grid'
import ControlPanel from '@/components/ControlPanel'

export default function App() {
  const {
    waves,
    monsters,
    particles,
    waveNumber,
    totalWaves,
    waveStatus,
    waveCountdown,
    tick,
    towers,
  } = useGameStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
      setIsMobile(window.innerWidth < 1024)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const bounds = useMemo(() => getGridBounds(GRID_COLS, GRID_ROWS), [])
  const gridWidth = bounds.maxX - bounds.minX + 40
  const gridHeight = bounds.maxY - bounds.minY + 40

  const panelWidth = isMobile ? 0 : 260
  const topBarHeight = 56
  const availableW = viewport.width - panelWidth - 40
  const availableH = viewport.height - topBarHeight - 40
  const scale = Math.min(availableW / gridWidth, availableH / gridHeight, 1.2)
  const scaledW = gridWidth * scale
  const scaledH = gridHeight * scale
  const offsetX = (viewport.width - panelWidth - scaledW) / 2 - bounds.minX * scale + 20
  const offsetY = topBarHeight + (availableH - scaledH) / 2 - bounds.minY * scale

  useEffect(() => {
    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000)
      lastTimeRef.current = time
      tick(dt)
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [tick])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, viewport.width, viewport.height)

    const toScreen = (x: number, y: number) => ({
      x: offsetX + x * scale,
      y: offsetY + y * scale,
    })

    const trailCanvas = document.createElement('canvas')
    trailCanvas.width = viewport.width * dpr
    trailCanvas.height = viewport.height * dpr
    const trailCtx = trailCanvas.getContext('2d')
    if (trailCtx) {
      trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.drawImage(trailCanvas, 0, 0)
    }

    for (let i = 0; i < PATH_COORDS.length - 1; i++) {
      const a = PATH_COORDS[i]
      const b = PATH_COORDS[i + 1]
      const ap = axialToPixel(a.q, a.r)
      const bp = axialToPixel(b.q, b.r)
      const sa = toScreen(ap.x, ap.y)
      const sb = toScreen(bp.x, bp.y)
      ctx.beginPath()
      ctx.moveTo(sa.x, sa.y)
      ctx.lineTo(sb.x, sb.y)
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.08)'
      ctx.lineWidth = 24 * scale
      ctx.stroke()
    }

    for (const monster of monsters) {
      if (monster.hp <= 0 || monster.spawnDelay > 0) continue
      const m = toScreen(monster.x, monster.y)
      const bodyColor = monster.isHit ? '#ff1744' : monster.armor === ArmorType.HEAVY ? '#78909c' : '#aed581'
      const size = (monster.armor === ArmorType.HEAVY ? 14 : 10) * scale

      if (monster.pathIndex > 0 || monster.pathProgress > 0.05) {
        const prevIdx = Math.max(0, monster.pathIndex - 1)
        const prevPos = getPathPosition(prevIdx, 0)
        const pp = toScreen(prevPos.x, prevPos.y)
        const pathProgress = monster.pathIndex + monster.pathProgress
        const totalPath = PATH_COORDS.length
        const trailLength = Math.min(pathProgress / totalPath, 0.15)
        const gradient = ctx.createLinearGradient(pp.x, pp.y, m.x, m.y)
        gradient.addColorStop(0, 'rgba(79, 195, 247, 0)')
        gradient.addColorStop(1, 'rgba(79, 195, 247, 0.3)')
        ctx.beginPath()
        ctx.moveTo(pp.x, pp.y)
        ctx.lineTo(m.x, m.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 0.5 * scale
        ctx.stroke()
      }

      ctx.beginPath()
      if (monster.armor === ArmorType.HEAVY) {
        ctx.rect(m.x - size / 2, m.y - size / 2, size, size)
      } else {
        ctx.arc(m.x, m.y, size / 2, 0, Math.PI * 2)
      }
      ctx.fillStyle = bodyColor
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      const hpRatio = Math.max(0, monster.hp / monster.maxHp)
      const hpW = 24 * scale
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fillRect(m.x - hpW / 2, m.y - size / 2 - 8 * scale, hpW, 3 * scale)
      ctx.fillStyle = hpRatio > 0.5 ? '#81c784' : hpRatio > 0.25 ? '#ffd54f' : '#ff5252'
      ctx.fillRect(m.x - hpW / 2, m.y - size / 2 - 8 * scale, hpW * hpRatio, 3 * scale)
    }

    for (const wave of waves) {
      const c = toScreen(wave.centerX, wave.centerY)
      const r = wave.radius * scale
      const thickness = 6 * scale
      const gradient = ctx.createRadialGradient(c.x, c.y, Math.max(0, r - thickness), c.x, c.y, r + thickness)
      gradient.addColorStop(0, hexToRgba(wave.color, 0))
      gradient.addColorStop(0.4, hexToRgba(wave.color, wave.opacity * 0.7))
      gradient.addColorStop(0.5, hexToRgba(wave.color, wave.opacity))
      gradient.addColorStop(0.6, hexToRgba(wave.color, wave.opacity * 0.7))
      gradient.addColorStop(1, hexToRgba(wave.color, 0))
      ctx.beginPath()
      ctx.arc(c.x, c.y, r + thickness, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      if (wave.reflections > 0) {
        ctx.beginPath()
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = hexToRgba('#ab47bc', wave.opacity * 0.5)
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    for (const tower of towers) {
      if (tower.type === 'shield') continue
      const t = toScreen(tower.x, tower.y)
      const fireProgress = (useGameStore.getState().gameTime - tower.lastFireTime) / 2.0
      if (fireProgress < 0.3) {
        const pulseR = (10 + fireProgress * 20) * scale
        ctx.beginPath()
        ctx.arc(t.x, t.y, pulseR, 0, Math.PI * 2)
        ctx.strokeStyle = hexToRgba(tower.color, 0.3 * (1 - fireProgress / 0.3))
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    for (const p of particles) {
      const s = toScreen(p.x, p.y)
      const lifeRatio = p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(s.x, s.y, p.size * scale * lifeRatio, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(p.color, lifeRatio)
      ctx.fill()
    }
  }, [waves, monsters, particles, viewport, scale, offsetX, offsetY, towers])

  const showWaveInfo = waveNumber > 0
  const countdownText = waveStatus === 'countdown'
    ? `${waveCountdown.toFixed(1)}s`
    : waveStatus === 'complete' && waveNumber < totalWaves
    ? `下一波 ${waveCountdown.toFixed(1)}s`
    : ''

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a1a',
        overflow: 'hidden',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Grid scale={scale} offsetX={offsetX + 20} offsetY={offsetY} />
        </div>
      </div>

      <AnimatePresence>
        {showWaveInfo && (
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 12,
              left: isMobile ? 16 : '50%',
              transform: isMobile ? 'none' : 'translateX(-50%)',
              right: isMobile ? 88 : 'auto',
              padding: '10px 20px',
              background: 'rgba(26, 26, 46, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e0e0e0',
              fontFamily: "'Courier New', monospace",
              fontSize: 13,
              letterSpacing: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              zIndex: 60,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888' }}>WAVE</span>
              <span style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: waveStatus === 'active' ? '#81c784' : '#4fc3f7',
              }}>
                {waveNumber}/{totalWaves}
              </span>
            </div>
            {countdownText && (
              <motion.div
                key={countdownText}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '2px 10px',
                  borderRadius: 6,
                  background: waveStatus === 'countdown'
                    ? 'rgba(255, 138, 101, 0.2)'
                    : 'rgba(79, 195, 247, 0.2)',
                  color: waveStatus === 'countdown' ? '#ff8a65' : '#4fc3f7',
                  fontSize: 12,
                }}
              >
                {countdownText}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!showWaveInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            right: isMobile ? 88 : panelWidth + 16,
            padding: '12px 20px',
            color: '#888',
            fontFamily: "'Courier New', monospace",
            fontSize: 12,
            letterSpacing: 1,
            zIndex: 40,
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#4fc3f7' }}>◆</span> 音波塔防战术沙盒
          <span style={{ margin: '0 12px', color: '#333' }}>|</span>
          选择塔类型 → 点击六边形部署 → 开始波次
          <span style={{ margin: '0 12px', color: '#333' }}>|</span>
          路径格子不可部署
        </motion.div>
      )}

      <ControlPanel />
    </div>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
