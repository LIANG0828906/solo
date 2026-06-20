import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useMagicLoomStore } from './store'
import { updateLines, sortLinesForRender, type UpdateContext, type Line } from './weaver'
import { RUNE_COLOR, getButtonColors, getNebulaColors, hexToRgb, type NebulaColors } from './theme'

const RUNE_BLINK_PERIOD = 2000
const FPS_CHECK_INTERVAL = 500
const FPS_THRESHOLD = 55
const NEBULA_UPDATE_INTERVAL = 2

const BREATHING_CONFIG = {
  brightnessCycle: 2500,
  brightnessMin: 0.85,
  brightnessMax: 1.0,
  scaleCycle: 2500,
  scaleMin: 1.0,
  scaleMax: 1.01,
  scalePhaseOffset: 300,
}

interface NebulaBand {
  y: number
  height: number
  speed: number
  phase: number
  opacity: number
}

interface GlowOrb {
  x: number
  y: number
  radius: number
  speedX: number
  speedY: number
  phase: number
  opacity: number
  colorIndex: number
}

const initNebulaBands = (h: number): NebulaBand[] => {
  const bands: NebulaBand[] = []
  for (let i = 0; i < 5; i++) {
    bands.push({
      y: Math.random() * h,
      height: 60 + Math.random() * 120,
      speed: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.08 + Math.random() * 0.12,
    })
  }
  return bands
}

const initGlowOrbs = (w: number, h: number): GlowOrb[] => {
  const orbs: GlowOrb[] = []
  for (let i = 0; i < 8; i++) {
    orbs.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 80 + Math.random() * 200,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.1 + Math.random() * 0.15,
      colorIndex: i % 2,
    })
  }
  return orbs
}

export default function MagicLoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const runeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameCountRef = useRef(0)
  const lastFpsCheckRef = useRef(performance.now())
  const lastFrameTimeRef = useRef(performance.now())
  const frameCounterRef = useRef(0)
  const bgFrameCounterRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const bandsRef = useRef<NebulaBand[]>([])
  const orbsRef = useRef<GlowOrb[]>([])
  const bgInitedRef = useRef(false)

  const lines = useMagicLoomStore((s) => s.lines)
  const paused = useMagicLoomStore((s) => s.paused)
  const theme = useMagicLoomStore((s) => s.theme)
  const vortex = useMagicLoomStore((s) => s.vortex)
  const pulses = useMagicLoomStore((s) => s.pulses)
  const reducedQuality = useMagicLoomStore((s) => s.reducedQuality)
  const breathingEnabled = useMagicLoomStore((s) => s.breathingEnabled)

  const updateLinesState = useMagicLoomStore((s) => s.updateLinesState)
  const setVortexActive = useMagicLoomStore((s) => s.setVortexActive)
  const setVortexPosition = useMagicLoomStore((s) => s.setVortexPosition)
  const triggerPulse = useMagicLoomStore((s) => s.triggerPulse)
  const togglePause = useMagicLoomStore((s) => s.togglePause)
  const reset = useMagicLoomStore((s) => s.reset)
  const saveSnapshot = useMagicLoomStore((s) => s.saveSnapshot)
  const toggleTheme = useMagicLoomStore((s) => s.toggleTheme)
  const setReducedQuality = useMagicLoomStore((s) => s.setReducedQuality)
  const toggleBreathing = useMagicLoomStore((s) => s.toggleBreathing)

  const [viewportSize, setViewportSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })

  const buttonColors = useMemo(() => getButtonColors(theme), [theme])
  const nebulaColors = useMemo(() => getNebulaColors(theme), [theme])

  useEffect(() => {
    const onResize = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight })
      bgInitedRef.current = false
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const getTapestryBounds = useCallback(() => {
    const tapestryW = viewportSize.w * 0.8
    const tapestryH = viewportSize.h * 0.8
    const tapestryX = viewportSize.w * 0.1
    const tapestryY = viewportSize.h * 0.1
    return { tapestryX, tapestryY, tapestryW, tapestryH }
  }, [viewportSize])

  const ensureBgInitialized = useCallback((w: number, h: number) => {
    if (!bgInitedRef.current) {
      bandsRef.current = initNebulaBands(h)
      orbsRef.current = initGlowOrbs(w, h)
      bgInitedRef.current = true
    }
  }, [])

  const drawNebulaBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, ts: number, colors: NebulaColors) => {
    ensureBgInitialized(w, h)

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
    bgGrad.addColorStop(0, colors.bgTop)
    bgGrad.addColorStop(1, colors.bgBottom)
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    const orbs = orbsRef.current
    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i]
      const time = ts * 0.0005
      const pulse = 0.7 + 0.3 * Math.sin(time + orb.phase)

      orb.x += orb.speedX
      orb.y += orb.speedY

      if (orb.x < -orb.radius) orb.x = w + orb.radius
      if (orb.x > w + orb.radius) orb.x = -orb.radius
      if (orb.y < -orb.radius) orb.y = h + orb.radius
      if (orb.y > h + orb.radius) orb.y = -orb.radius

      const orbColor = orb.colorIndex === 0 ? colors.glow1 : colors.glow2
      const { r, g, b } = hexToRgb(orbColor)
      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius * pulse)
      grad.addColorStop(0, `rgba(${r},${g},${b},${orb.opacity * pulse})`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2)
      ctx.fill()
    }

    const bands = bandsRef.current
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i]
      const time = ts * 0.0003
      const wave = Math.sin(time + band.phase) * 20
      const bandY = band.y + wave

      const bandColor = i % 2 === 0 ? colors.band1 : colors.band2
      const { r, g, b } = hexToRgb(bandColor)

      const grad = ctx.createLinearGradient(0, bandY - band.height / 2, 0, bandY + band.height / 2)
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`)
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${band.opacity})`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

      ctx.fillStyle = grad
      ctx.fillRect(0, bandY - band.height / 2, w, band.height)

      band.y += band.speed
      if (band.y > h + band.height) {
        band.y = -band.height
      }
    }

    ctx.globalAlpha = 0.02
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5 + ts * 0.01) % w
      const y = (i * 89.3 + Math.sin(ts * 0.001 + i) * 30) % h
      const size = 1 + (i % 3)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(x, y, size, size)
    }
    ctx.globalAlpha = 1
  }, [ensureBgInitialized])

  const generateRunePattern = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) => {
    ctx.save()
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin(phase))
    ctx.globalAlpha = alpha
    ctx.strokeStyle = RUNE_COLOR
    ctx.lineWidth = 2
    ctx.shadowColor = RUNE_COLOR
    ctx.shadowBlur = 12

    const runeCount = Math.floor(h / 40)
    for (let i = 0; i < runeCount; i++) {
      const y = (i + 0.5) * (h / runeCount)
      const offset = Math.sin(i * 1.7 + phase * 4) * 8

      ctx.beginPath()
      ctx.moveTo(w * 0.2, y - 10 + offset)
      ctx.lineTo(w * 0.8, y - 10 + offset)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(w * 0.5, y - 18 + offset)
      ctx.lineTo(w * 0.5, y + 8 + offset)
      ctx.stroke()

      if (i % 2 === 0) {
        ctx.beginPath()
        ctx.arc(w * 0.5, y + offset, 6, 0, Math.PI * 2)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.moveTo(w * 0.3, y + offset)
        ctx.lineTo(w * 0.7, y + offset)
        ctx.stroke()
      }
    }
    ctx.restore()
  }, [])

  const drawBorder = useCallback((ctx: CanvasRenderingContext2D, phase: number) => {
    const { tapestryX, tapestryY, tapestryW, tapestryH } = getTapestryBounds()
    const borderW = viewportSize.w * 0.1

    if (!runeCanvasRef.current) {
      runeCanvasRef.current = document.createElement('canvas')
    }
    const off = runeCanvasRef.current
    off.width = borderW
    off.height = viewportSize.h
    const offCtx = off.getContext('2d')!
    offCtx.clearRect(0, 0, off.width, off.height)
    generateRunePattern(offCtx, off.width, off.height, phase)

    ctx.drawImage(off, 0, 0)
    ctx.save()
    ctx.translate(viewportSize.w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(off, 0, 0)
    ctx.restore()
  }, [viewportSize, getTapestryBounds, generateRunePattern])

  const drawLines = useCallback((ctx: CanvasRenderingContext2D, sortedLines: Line[]) => {
    const { tapestryX, tapestryY, tapestryW, tapestryH } = getTapestryBounds()

    ctx.save()
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    for (const line of sortedLines) {
      const totalOffset = line.offset + line.vortexOffset + line.pulseOffset
      ctx.strokeStyle = line.color
      ctx.globalAlpha = 0.85
      ctx.beginPath()

      if (line.type === 'warp') {
        const x = tapestryX + line.basePos * tapestryW + totalOffset
        ctx.moveTo(x, tapestryY)
        ctx.lineTo(x, tapestryY + tapestryH)
      } else {
        const y = tapestryY + line.basePos * tapestryH + totalOffset
        ctx.moveTo(tapestryX, y)
        ctx.lineTo(tapestryX + tapestryW, y)
      }
      ctx.stroke()
    }
    ctx.restore()
  }, [getTapestryBounds])

  const renderBackground = useCallback((ts: number) => {
    const canvas = bgCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== viewportSize.w * dpr || canvas.height !== viewportSize.h * dpr) {
      canvas.width = viewportSize.w * dpr
      canvas.height = viewportSize.h * dpr
      canvas.style.width = viewportSize.w + 'px'
      canvas.style.height = viewportSize.h + 'px'
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawNebulaBackground(ctx, viewportSize.w, viewportSize.h, ts, nebulaColors)
  }, [viewportSize, drawNebulaBackground, nebulaColors])

  const render = useCallback((ts: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== viewportSize.w * dpr || canvas.height !== viewportSize.h * dpr) {
      canvas.width = viewportSize.w * dpr
      canvas.height = viewportSize.h * dpr
      canvas.style.width = viewportSize.w + 'px'
      canvas.style.height = viewportSize.h + 'px'
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, viewportSize.w, viewportSize.h)

    const { tapestryX, tapestryY, tapestryW, tapestryH } = getTapestryBounds()

    let breathBrightness = 1.0
    let breathScale = 1.0

    if (breathingEnabled) {
      const brightnessPhase = (ts % BREATHING_CONFIG.brightnessCycle) / BREATHING_CONFIG.brightnessCycle
      breathBrightness = BREATHING_CONFIG.brightnessMin +
        (BREATHING_CONFIG.brightnessMax - BREATHING_CONFIG.brightnessMin) *
        (0.5 + 0.5 * Math.cos(brightnessPhase * Math.PI * 2))

      const scaleTs = ts - BREATHING_CONFIG.scalePhaseOffset
      const scalePhase = (scaleTs % BREATHING_CONFIG.scaleCycle) / BREATHING_CONFIG.scaleCycle
      breathScale = BREATHING_CONFIG.scaleMin +
        (BREATHING_CONFIG.scaleMax - BREATHING_CONFIG.scaleMin) *
        (0.5 + 0.5 * Math.cos(scalePhase * Math.PI * 2))
    }

    ctx.save()

    if (breathingEnabled && breathScale !== 1.0) {
      const cx = tapestryX + tapestryW / 2
      const cy = tapestryY + tapestryH / 2
      ctx.translate(cx, cy)
      ctx.scale(breathScale, breathScale)
      ctx.translate(-cx, -cy)
    }

    ctx.fillStyle = 'rgba(15, 15, 20, 0.5)'
    ctx.fillRect(tapestryX, tapestryY, tapestryW, tapestryH)

    if (breathingEnabled && breathBrightness < 1.0) {
      ctx.filter = `brightness(${breathBrightness})`
    }

    const phase = (ts % RUNE_BLINK_PERIOD) / RUNE_BLINK_PERIOD * Math.PI * 2
    drawBorder(ctx, phase)

    const sorted = sortLinesForRender(lines)
    drawLines(ctx, sorted)

    ctx.filter = 'none'
    ctx.restore()
  }, [viewportSize, getTapestryBounds, drawBorder, drawLines, lines, breathingEnabled])

  useEffect(() => {
    const tick = (ts: number) => {
      frameCounterRef.current++
      bgFrameCounterRef.current++

      const sinceFps = ts - lastFpsCheckRef.current
      if (sinceFps >= FPS_CHECK_INTERVAL) {
        const fps = (frameCounterRef.current / sinceFps) * 1000
        lastFpsCheckRef.current = ts
        frameCounterRef.current = 0
        if (fps < FPS_THRESHOLD && !reducedQuality) {
          setReducedQuality(true)
        } else if (fps >= FPS_THRESHOLD + 5 && reducedQuality) {
          setReducedQuality(false)
        }
      }

      const { tapestryX, tapestryY, tapestryW, tapestryH } = getTapestryBounds()

      const shouldUpdate = reducedQuality ? frameCountRef.current % 2 === 0 : true
      frameCountRef.current++

      if (shouldUpdate) {
        const ctxObj: UpdateContext = {
          timestamp: ts,
          viewportW: viewportSize.w,
          viewportH: viewportSize.h,
          tapestryX,
          tapestryY,
          tapestryW,
          tapestryH,
          vortex,
          pulses,
          paused,
          theme,
        }
        const updated = updateLines(lines, ctxObj)
        updateLinesState(() => updated)
      }

      if (bgFrameCounterRef.current % NEBULA_UPDATE_INTERVAL === 0) {
        renderBackground(ts)
      }

      render(ts)
      lastFrameTimeRef.current = ts
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [lines, paused, theme, vortex, pulses, reducedQuality, breathingEnabled, viewportSize, getTapestryBounds, render, renderBackground, updateLinesState, setReducedQuality])

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? 0
      clientY = e.touches[0]?.clientY ?? 0
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const onMouseEnter = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e)
    setVortexActive(true, x, y)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e)
    setVortexPosition(x, y)
  }

  const onMouseLeave = () => {
    setVortexActive(false)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    triggerPulse(performance.now())
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e)
    setVortexActive(true, x, y)
    triggerPulse(performance.now())
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e)
    setVortexPosition(x, y)
  }

  const onTouchEnd = () => {
    setVortexActive(false)
  }

  const onSaveSnapshot = () => {
    if (canvasRef.current) {
      saveSnapshot(canvasRef.current)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={bgCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
          cursor: 'crosshair',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 16,
          padding: '0 20px',
          height: 50,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 20,
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <button
          onClick={togglePause}
          style={buttonStyle(buttonColors.pause, buttonColors.pauseText)}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          {paused ? '继续' : '暂停'}
        </button>
        <button
          onClick={reset}
          style={buttonStyle(buttonColors.reset, buttonColors.resetText)}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          重置图案
        </button>
        <button
          onClick={onSaveSnapshot}
          style={buttonStyle(buttonColors.save, buttonColors.saveText)}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          保存快照
        </button>
        <button
          onClick={toggleTheme}
          style={buttonStyle(buttonColors.theme, buttonColors.themeText)}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          切换主题
        </button>
        <button
          onClick={toggleBreathing}
          style={breathingButtonStyle(breathingEnabled)}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          {breathingEnabled ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  )
}

const buttonStyle = (bg: string, text: string): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: bg,
  color: text,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease, color 0.3s ease',
  fontFamily: 'inherit',
  outline: 'none',
  userSelect: 'none',
})

const breathingButtonStyle = (enabled: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 8,
  border: 'none',
  background: enabled ? '#6C5CE7' : '#2D3436',
  color: '#FFFFFF',
  fontSize: 18,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease',
  fontFamily: 'inherit',
  outline: 'none',
  userSelect: 'none',
  lineHeight: 1,
})

const applyHover = (el: HTMLElement) => {
  el.style.transform = 'scale(1.1)'
  el.style.boxShadow = '0 0 12px rgba(255,255,255,0.4)'
}

const removeHover = (el: HTMLElement) => {
  el.style.transform = 'scale(1)'
  el.style.boxShadow = 'none'
}
