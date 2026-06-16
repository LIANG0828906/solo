import { useEffect, useRef, useState, useCallback } from 'react'
import { useMagicLoomStore } from './store'
import { updateLines, sortLinesForRender, type UpdateContext, type Line } from './weaver'
import { RUNE_COLOR } from './theme'

const RUNE_BLINK_PERIOD = 2000
const FPS_CHECK_INTERVAL = 500
const FPS_THRESHOLD = 55

export default function MagicLoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameCountRef = useRef(0)
  const lastFpsCheckRef = useRef(performance.now())
  const lastFrameTimeRef = useRef(performance.now())
  const frameCounterRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const lines = useMagicLoomStore((s) => s.lines)
  const paused = useMagicLoomStore((s) => s.paused)
  const theme = useMagicLoomStore((s) => s.theme)
  const vortex = useMagicLoomStore((s) => s.vortex)
  const pulses = useMagicLoomStore((s) => s.pulses)
  const reducedQuality = useMagicLoomStore((s) => s.reducedQuality)

  const updateLinesState = useMagicLoomStore((s) => s.updateLinesState)
  const setVortexActive = useMagicLoomStore((s) => s.setVortexActive)
  const setVortexPosition = useMagicLoomStore((s) => s.setVortexPosition)
  const triggerPulse = useMagicLoomStore((s) => s.triggerPulse)
  const togglePause = useMagicLoomStore((s) => s.togglePause)
  const reset = useMagicLoomStore((s) => s.reset)
  const saveSnapshot = useMagicLoomStore((s) => s.saveSnapshot)
  const toggleTheme = useMagicLoomStore((s) => s.toggleTheme)
  const setReducedQuality = useMagicLoomStore((s) => s.setReducedQuality)

  const [viewportSize, setViewportSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })

  useEffect(() => {
    const onResize = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight })
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

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, viewportSize.w, viewportSize.h)

    const { tapestryX, tapestryY, tapestryW, tapestryH } = getTapestryBounds()
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(tapestryX, tapestryY, tapestryW, tapestryH)

    const phase = (ts % RUNE_BLINK_PERIOD) / RUNE_BLINK_PERIOD * Math.PI * 2
    drawBorder(ctx, phase)

    const sorted = sortLinesForRender(lines)
    drawLines(ctx, sorted)
  }, [viewportSize, getTapestryBounds, drawBorder, drawLines, lines])

  useEffect(() => {
    const tick = (ts: number) => {
      frameCounterRef.current++

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
  }, [lines, paused, theme, vortex, pulses, reducedQuality, viewportSize, getTapestryBounds, render, updateLinesState, setReducedQuality])

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
        ref={canvasRef}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
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
        }}
      >
        <button
          onClick={togglePause}
          style={buttonStyle('#2D3436')}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          {paused ? '继续' : '暂停'}
        </button>
        <button
          onClick={reset}
          style={buttonStyle('#E17055')}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          重置图案
        </button>
        <button
          onClick={onSaveSnapshot}
          style={buttonStyle('#00CEC9')}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          保存快照
        </button>
        <button
          onClick={toggleTheme}
          style={buttonStyle('#6C5CE7')}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => removeHover(e.currentTarget)}
        >
          切换主题
        </button>
      </div>
    </div>
  )
}

const buttonStyle = (bg: string): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: bg,
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  fontFamily: 'inherit',
  outline: 'none',
  userSelect: 'none',
})

const applyHover = (el: HTMLElement) => {
  el.style.transform = 'scale(1.1)'
  el.style.boxShadow = '0 0 12px rgba(255,255,255,0.4)'
}

const removeHover = (el: HTMLElement) => {
  el.style.transform = 'scale(1)'
  el.style.boxShadow = 'none'
}
