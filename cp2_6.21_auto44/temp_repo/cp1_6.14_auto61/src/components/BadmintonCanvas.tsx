import { useRef, useEffect, useCallback } from 'react'

interface ScoreData {
  homeTeam: string
  awayTeam: string
  currentSet: number
  homeScore: number
  awayScore: number
  isFinished: boolean
  winner: string | null
  setsWonHome: number
  setsWonAway: number
}

interface TrailParticle {
  x: number
  y: number
  alpha: number
  size: number
  vx: number
  vy: number
}

interface BurstParticle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  life: number
  maxLife: number
  size: number
}

interface ShuttleState {
  active: boolean
  startX: number
  startY: number
  endX: number
  endY: number
  progress: number
  side: 'home' | 'away'
  trail: TrailParticle[]
  burst: BurstParticle[]
  landed: boolean
}

const COURT_COLOR = '#2d7a3a'
const LINE_COLOR = '#ffffff'
const SHUTTLE_COLOR = '#ffffff'
const TRAIL_COLOR = '#ffffaa'

export default function BadmintonCanvas({ score }: { score: ScoreData | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shuttleRef = useRef<ShuttleState>({
    active: false, startX: 0, startY: 0, endX: 0, endY: 0,
    progress: 0, side: 'home', trail: [], burst: [], landed: false,
  })
  const prevHomeScoreRef = useRef(0)
  const prevAwayScoreRef = useRef(0)
  const animFrameRef = useRef(0)
  const lastTimeRef = useRef(0)

  const drawCourt = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = COURT_COLOR
    ctx.fillRect(0, 0, w, h)

    const margin = 30
    const courtW = w - margin * 2
    const courtH = h - margin * 2

    ctx.strokeStyle = LINE_COLOR
    ctx.lineWidth = 2

    ctx.strokeRect(margin, margin, courtW, courtH)

    const netX = w / 2
    ctx.beginPath()
    ctx.moveTo(netX, margin)
    ctx.lineTo(netX, h - margin)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.setLineDash([6, 4])
    ctx.stroke()
    ctx.setLineDash([])

    const serviceLineOffset = courtH * 0.15
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin, margin + serviceLineOffset)
    ctx.lineTo(w - margin, margin + serviceLineOffset)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(margin, h - margin - serviceLineOffset)
    ctx.lineTo(w - margin, h - margin - serviceLineOffset)
    ctx.stroke()

    const sideLineOffset = courtW * 0.08
    ctx.beginPath()
    ctx.moveTo(margin + sideLineOffset, margin)
    ctx.lineTo(margin + sideLineOffset, h - margin)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(w - margin - sideLineOffset, margin)
    ctx.lineTo(w - margin - sideLineOffset, h - margin)
    ctx.stroke()
  }, [])

  const launchShuttle = useCallback((side: 'home' | 'away', canvasW: number, canvasH: number) => {
    const margin = 30
    const shuttle = shuttleRef.current
    shuttle.active = true
    shuttle.landed = false
    shuttle.progress = 0
    shuttle.trail = []
    shuttle.burst = []
    shuttle.side = side

    if (side === 'home') {
      shuttle.startX = margin + 40
      shuttle.startY = canvasH * 0.7
      shuttle.endX = canvasW - margin - 40
      shuttle.endY = canvasH * 0.3
    } else {
      shuttle.startX = canvasW - margin - 40
      shuttle.startY = canvasH * 0.3
      shuttle.endX = margin + 40
      shuttle.endY = canvasH * 0.7
    }
  }, [])

  useEffect(() => {
    if (!score) return
    const homeChanged = score.homeScore !== prevHomeScoreRef.current
    const awayChanged = score.awayScore !== prevAwayScoreRef.current

    if (homeChanged && score.homeScore > prevHomeScoreRef.current) {
      const canvas = canvasRef.current
      if (canvas) launchShuttle('home', canvas.width, canvas.height)
    }
    if (awayChanged && score.awayScore > prevAwayScoreRef.current) {
      const canvas = canvasRef.current
      if (canvas) launchShuttle('away', canvas.width, canvas.height)
    }

    prevHomeScoreRef.current = score.homeScore
    prevAwayScoreRef.current = score.awayScore
  }, [score, launchShuttle])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.parentElement!.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resizeCanvas()
    const resizeObs = new ResizeObserver(resizeCanvas)
    resizeObs.observe(canvas.parentElement!)

    const animate = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016
      lastTimeRef.current = time
      const dpr = window.devicePixelRatio
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawCourt(ctx, w, h)

      const shuttle = shuttleRef.current

      if (shuttle.active && !shuttle.landed) {
        shuttle.progress += dt * 1.2
        if (shuttle.progress >= 1) {
          shuttle.progress = 1
          shuttle.landed = true
          const cx = shuttle.endX
          const cy = shuttle.endY
          for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3
            const speed = 40 + Math.random() * 80
            shuttle.burst.push({
              x: cx, y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              alpha: 1,
              life: 0.6 + Math.random() * 0.4,
              maxLife: 0.6 + Math.random() * 0.4,
              size: 2 + Math.random() * 3,
            })
          }
        }

        const t = shuttle.progress
        const arcHeight = h * 0.35
        const x = shuttle.startX + (shuttle.endX - shuttle.startX) * t
        const y = shuttle.startY + (shuttle.endY - shuttle.startY) * t - arcHeight * 4 * t * (1 - t)

        if (Math.random() < 0.6) {
          shuttle.trail.push({
            x, y,
            alpha: 0.8,
            size: 3 + Math.random() * 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
          })
        }

        if (!shuttle.landed) {
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fillStyle = SHUTTLE_COLOR
          ctx.fill()
          ctx.shadowColor = TRAIL_COLOR
          ctx.shadowBlur = 12
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }

      for (let i = shuttle.trail.length - 1; i >= 0; i--) {
        const p = shuttle.trail[i]
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.alpha -= dt * 2.5
        p.size -= dt * 3
        if (p.alpha <= 0 || p.size <= 0) {
          shuttle.trail.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,170,${p.alpha})`
        ctx.fill()
      }

      for (let i = shuttle.burst.length - 1; i >= 0; i--) {
        const p = shuttle.burst[i]
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.96
        p.vy *= 0.96
        p.life -= dt
        p.alpha = Math.max(0, p.life / p.maxLife)
        if (p.life <= 0) {
          shuttle.burst.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,230,100,${p.alpha})`
        ctx.shadowColor = 'rgba(255,215,0,0.6)'
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (shuttle.landed && shuttle.burst.length === 0 && shuttle.trail.length === 0) {
        shuttle.active = false
      }

      ctx.restore()
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      resizeObs.disconnect()
    }
  }, [drawCourt])

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}
