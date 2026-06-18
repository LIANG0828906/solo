import { useRef, useEffect, useCallback } from 'react'
import type { PatternParams, ShapeType, DynamicType, ColorTheme } from './App'

interface TrailPoint {
  x: number
  y: number
  age: number
}

interface ElementState {
  angle: number
  radius: number
  speed: number
  phase: number
  alpha: number
  size: number
  hueOffset: number
}

export function usePatternEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  params: PatternParams,
) {
  const animRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const elementsRef = useRef<ElementState[]>([])
  const trailRef = useRef<TrailPoint[]>([])
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const paramsRef = useRef<PatternParams>(params)
  const lastFrameRef = useRef<number>(0)

  useEffect(() => {
    paramsRef.current = params
  }, [params])

  const initElements = useCallback((count: number) => {
    const els: ElementState[] = []
    for (let i = 0; i < count; i++) {
      els.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 200 + 30,
        speed: (Math.random() * 0.5 + 0.3),
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.6 + 0.3,
        size: Math.random() * 4 + 1,
        hueOffset: Math.random() * 60 - 30,
      })
    }
    elementsRef.current = els
  }, [])

  useEffect(() => {
    initElements(300)
  }, [initElements])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      trailRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        age: 0,
      })
      if (trailRef.current.length > 60) {
        trailRef.current = trailRef.current.slice(-60)
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = null
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [canvasRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resizeCanvas()
    const resizeObs = new ResizeObserver(resizeCanvas)
    resizeObs.observe(canvas.parentElement!)

    const draw = (timestamp: number) => {
      const dt = lastFrameRef.current ? (timestamp - lastFrameRef.current) / 1000 : 0.016
      lastFrameRef.current = timestamp

      const p = paramsRef.current
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const cx = w / 2
      const cy = h / 2

      timeRef.current += dt * p.speed

      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, '#0D0D1A')
      gradient.addColorStop(1, '#1A1A2E')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'

      const baseHue = (timeRef.current / 20) * 360 % 360
      const elements = elementsRef.current
      const count = Math.min(elements.length, 300 + Math.floor(p.speed * 100))

      for (let i = 0; i < count; i++) {
        const el = elements[i % elements.length]
        let x: number, y: number

        const t = timeRef.current
        const phaseOffset = el.phase

        switch (p.shape as ShapeType) {
          case 'circle': {
            const r = el.radius * (0.6 + 0.4 * Math.sin(t * el.speed + phaseOffset))
            const a = el.angle + t * el.speed * 0.3
            x = cx + Math.cos(a) * r
            y = cy + Math.sin(a) * r
            break
          }
          case 'spiral': {
            const spiralT = t * el.speed * 0.5 + phaseOffset
            const r = (spiralT % (Math.PI * 8)) * 12 + el.radius * 0.3
            const a = spiralT + el.angle
            x = cx + Math.cos(a) * r
            y = cy + Math.sin(a) * r
            break
          }
          case 'ripple': {
            const rippleR = ((t * el.speed * 40 + phaseOffset * 50) % (Math.min(w, h) * 0.45))
            const a = el.angle + t * 0.1
            x = cx + Math.cos(a) * rippleR
            y = cy + Math.sin(a) * rippleR
            break
          }
          default: {
            x = cx
            y = cy
          }
        }

        let alpha = el.alpha
        let size = el.size

        switch (p.dynamicType as DynamicType) {
          case 'breathe': {
            const breathScale = 0.5 + 0.5 * Math.sin(t * 1.5 + phaseOffset)
            alpha = el.alpha * breathScale
            size = el.size * (0.7 + 0.6 * breathScale)
            break
          }
          case 'flow': {
            const dx = Math.sin(t * el.speed + phaseOffset) * 5
            const dy = Math.cos(t * el.speed * 0.7 + phaseOffset) * 5
            x += dx
            y += dy
            break
          }
          case 'blink': {
            if (Math.sin(t * 4 + phaseOffset * 3) > 0.3) {
              alpha = el.alpha
            } else {
              alpha = el.alpha * 0.15
            }
            break
          }
        }

        alpha = Math.max(0.05, Math.min(0.9, alpha))

        let hue = baseHue + el.hueOffset
        switch (p.colorTheme as ColorTheme) {
          case 'warmSun': hue = (hue % 60) + 10
            break
          case 'aurora': hue = (hue % 80) + 100
            break
          case 'darkNight': hue = (hue % 60) + 210
            break
        }

        const sat = 80 + Math.sin(t + phaseOffset) * 15
        const light = 55 + Math.sin(t * 0.5 + phaseOffset) * 15
        const color = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`

        ctx.save()
        ctx.shadowColor = color
        ctx.shadowBlur = 4
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        if (i % 3 === 0) {
          const nextEl = elements[(i + 1) % elements.length]
          if (nextEl) {
            let nx: number, ny: number
            switch (p.shape as ShapeType) {
              case 'circle': {
                const r2 = nextEl.radius * (0.6 + 0.4 * Math.sin(t * nextEl.speed + nextEl.phase))
                const a2 = nextEl.angle + t * nextEl.speed * 0.3
                nx = cx + Math.cos(a2) * r2
                ny = cy + Math.sin(a2) * r2
                break
              }
              case 'spiral': {
                const st2 = t * nextEl.speed * 0.5 + nextEl.phase
                const r2 = (st2 % (Math.PI * 8)) * 12 + nextEl.radius * 0.3
                const a2 = st2 + nextEl.angle
                nx = cx + Math.cos(a2) * r2
                ny = cy + Math.sin(a2) * r2
                break
              }
              case 'ripple': {
                const rr2 = ((t * nextEl.speed * 40 + nextEl.phase * 50) % (Math.min(w, h) * 0.45))
                const a2 = nextEl.angle + t * 0.1
                nx = cx + Math.cos(a2) * rr2
                ny = cy + Math.sin(a2) * rr2
                break
              }
              default: { nx = cx; ny = cy }
            }
            ctx.save()
            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha * 0.25})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(nx, ny)
            ctx.stroke()
            ctx.restore()
          }
        }
      }

      if (trailRef.current.length > 1) {
        const trail = trailRef.current
        for (let i = 1; i < trail.length; i++) {
          const pt = trail[i]
          pt.age += dt
          const prevPt = trail[i - 1]
          const ageFade = Math.max(0, 1 - pt.age * 2)
          const alpha = ageFade * 0.3
          if (alpha <= 0.01) continue

          let hue: number
          switch (p.colorTheme as ColorTheme) {
            case 'warmSun': hue = 30 + Math.sin(pt.age) * 15
              break
            case 'aurora': hue = 140 + Math.sin(pt.age) * 20
              break
            case 'darkNight': hue = 230 + Math.sin(pt.age) * 15
              break
          }

          ctx.save()
          ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`
          ctx.lineWidth = 2
          ctx.shadowColor = `hsla(${hue}, 90%, 70%, ${alpha * 0.5})`
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.moveTo(prevPt.x, prevPt.y)
          ctx.lineTo(pt.x, pt.y)
          ctx.stroke()
          ctx.restore()
        }
        trailRef.current = trailRef.current.filter((pt) => pt.age < 0.5)
      }

      ctx.globalCompositeOperation = 'source-over'

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      resizeObs.disconnect()
    }
  }, [canvasRef])

  return {
    captureThumbnail: useCallback((): string => {
      const canvas = canvasRef.current
      if (!canvas) return ''
      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = 150
      thumbCanvas.height = 150
      const tCtx = thumbCanvas.getContext('2d')
      if (!tCtx) return ''
      const size = Math.min(canvas.width, canvas.height)
      const sx = (canvas.width - size) / 2
      const sy = (canvas.height - size) / 2
      tCtx.drawImage(canvas, sx, sy, size, size, 0, 0, 150, 150)
      return thumbCanvas.toDataURL('image/png', 0.6)
    }, [canvasRef]),
  }
}
