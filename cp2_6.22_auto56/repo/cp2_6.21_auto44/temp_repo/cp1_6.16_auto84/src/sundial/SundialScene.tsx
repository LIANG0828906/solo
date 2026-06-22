import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../store/store'
import { SHICHEN, SEASON_COLORS, SEASON_NAMES, isAngleInUnlockZone, normalizeAngle } from './SundialUtils'
import { ParticleSystem } from '../effects/Particles'

interface SundialSceneProps {
  width: number
  height: number
}

export default function SundialScene({ width, height }: SundialSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const animationRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const centerX = width / 2
  const centerY = height / 2
  const dialRadius = Math.min(width, height) * 0.35
  const gnomonHeight = 150

  const shadowAngle = useGameStore((state) => state.shadowAngle)
  const setShadowAngle = useGameStore((state) => state.setShadowAngle)
  const unlockChart = useGameStore((state) => state.unlockChart)
  const unlockedCharts = useGameStore((state) => state.unlockedCharts)
  const gamePhase = useGameStore((state) => state.gamePhase)
  const [unlockAnimation, setUnlockAnimation] = useState<string | null>(null)
  const [crackProgress, setCrackProgress] = useState(0)
  const [crackLines, setCrackLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([])

  const zodiacSymbols: Record<string, string> = {
    '鼠': '🐭',
    '牛': '🐮',
    '虎': '🐯',
    '兔': '🐰',
    '龙': '🐲',
    '蛇': '🐍',
    '马': '🐴',
    '羊': '🐑',
    '猴': '🐵',
    '鸡': '🐔',
    '狗': '🐶',
    '猪': '🐷',
  }

  const drawDial = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createRadialGradient(centerX, centerY, dialRadius * 0.2, centerX, centerY, dialRadius)
    gradient.addColorStop(0, '#f0f0f0')
    gradient.addColorStop(0.5, '#d8d8d8')
    gradient.addColorStop(1, '#a8a8a8')

    ctx.beginPath()
    ctx.arc(centerX, centerY, dialRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    const ringGradient = ctx.createRadialGradient(centerX, centerY, dialRadius * 0.85, centerX, centerY, dialRadius * 0.95)
    ringGradient.addColorStop(0, '#8b6914')
    ringGradient.addColorStop(0.5, '#b8860b')
    ringGradient.addColorStop(1, '#6b5010')

    ctx.beginPath()
    ctx.arc(centerX, centerY, dialRadius * 0.95, 0, Math.PI * 2)
    ctx.arc(centerX, centerY, dialRadius * 0.85, 0, Math.PI * 2, true)
    ctx.fillStyle = ringGradient
    ctx.fill()

    ctx.strokeStyle = 'rgba(100, 80, 20, 0.3)'
    ctx.lineWidth = 1
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const r1 = dialRadius * 0.1 + Math.random() * dialRadius * 0.7
      const r2 = r1 + 30 + Math.random() * 50
      ctx.beginPath()
      ctx.moveTo(
        centerX + Math.cos(angle) * r1,
        centerY + Math.sin(angle) * r1
      )
      ctx.lineTo(
        centerX + Math.cos(angle) * r2,
        centerY + Math.sin(angle) * r2
      )
      ctx.stroke()
    }
  }, [centerX, centerY, dialRadius])

  const drawShichenMarks = useCallback((ctx: CanvasRenderingContext2D) => {
    const markRadius = dialRadius * 0.78

    SHICHEN.forEach((sc) => {
      const x = centerX + Math.cos(sc.angle) * markRadius
      const y = centerY + Math.sin(sc.angle) * markRadius

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(sc.angle + Math.PI / 2)

      ctx.fillStyle = '#5a7d6e'
      ctx.shadowBlur = 3
      ctx.shadowColor = '#7fffaa'
      ctx.font = 'bold 14px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sc.name, 0, 0)
      ctx.shadowBlur = 0

      ctx.restore()

      const zodiacX = centerX + Math.cos(sc.angle) * (markRadius + 35)
      const zodiacY = centerY + Math.sin(sc.angle) * (markRadius + 35)

      ctx.font = '20px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(zodiacSymbols[sc.zodiac], zodiacX, zodiacY)
    })

    const cardinalAngles = [
      { angle: -Math.PI / 2, label: '子' },
      { angle: 0, label: '卯' },
      { angle: Math.PI / 2, label: '午' },
      { angle: Math.PI, label: '酉' },
    ]

    cardinalAngles.forEach((c) => {
      const x1 = centerX + Math.cos(c.angle) * dialRadius * 0.88
      const y1 = centerY + Math.sin(c.angle) * dialRadius * 0.88
      const x2 = centerX + Math.cos(c.angle) * dialRadius * 0.82
      const y2 = centerY + Math.sin(c.angle) * dialRadius * 0.82

      ctx.strokeStyle = '#b8860b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    })
  }, [centerX, centerY, dialRadius, zodiacSymbols])

  const drawGnomon = useCallback((ctx: CanvasRenderingContext2D) => {
    const baseRadius = 15
    const topRadius = 8

    const gradient = ctx.createLinearGradient(centerX - baseRadius, centerY, centerX + baseRadius, centerY)
    gradient.addColorStop(0, '#8b6914')
    gradient.addColorStop(0.3, '#ffd700')
    gradient.addColorStop(0.7, '#ffd700')
    gradient.addColorStop(1, '#8b6914')

    ctx.beginPath()
    ctx.ellipse(centerX, centerY, baseRadius, baseRadius * 0.3, 0, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.fillStyle = '#daa520'
    ctx.beginPath()
    ctx.moveTo(centerX - baseRadius, centerY)
    ctx.lineTo(centerX - topRadius, centerY - gnomonHeight * 0.5)
    ctx.lineTo(centerX + topRadius, centerY - gnomonHeight * 0.5)
    ctx.lineTo(centerX + baseRadius, centerY)
    ctx.closePath()
    ctx.fill()

    const topGradient = ctx.createLinearGradient(centerX - topRadius, 0, centerX + topRadius, 0)
    topGradient.addColorStop(0, '#b8860b')
    topGradient.addColorStop(0.5, '#ffd700')
    topGradient.addColorStop(1, '#b8860b')

    ctx.fillStyle = topGradient
    ctx.beginPath()
    ctx.ellipse(centerX, centerY - gnomonHeight * 0.5, topRadius, topRadius * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 200, 0.6)'
    ctx.beginPath()
    ctx.ellipse(centerX - 3, centerY - gnomonHeight * 0.3, 2, gnomonHeight * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()
  }, [centerX, centerY, gnomonHeight])

  const drawShadow = useCallback((ctx: CanvasRenderingContext2D, angle: number) => {
    const shadowLength = dialRadius * 0.85
    const shadowEndX = centerX + Math.cos(angle) * shadowLength
    const shadowEndY = centerY + Math.sin(angle) * shadowLength

    ctx.save()
    ctx.globalAlpha = 0.35

    const gradient = ctx.createLinearGradient(centerX, centerY, shadowEndX, shadowEndY)
    gradient.addColorStop(0, 'rgba(50, 50, 60, 0.8)')
    gradient.addColorStop(0.7, 'rgba(50, 50, 60, 0.4)')
    gradient.addColorStop(1, 'rgba(50, 50, 60, 0)')

    const perpAngle = angle + Math.PI / 2
    const baseWidth = 18
    const tipWidth = 8

    ctx.beginPath()
    ctx.moveTo(
      centerX + Math.cos(perpAngle) * baseWidth,
      centerY + Math.sin(perpAngle) * baseWidth
    )
    ctx.lineTo(
      centerX - Math.cos(perpAngle) * baseWidth,
      centerY - Math.sin(perpAngle) * baseWidth
    )
    ctx.lineTo(
      shadowEndX - Math.cos(perpAngle) * tipWidth,
      shadowEndY - Math.sin(perpAngle) * tipWidth
    )
    ctx.lineTo(
      shadowEndX + Math.cos(perpAngle) * tipWidth,
      shadowEndY + Math.sin(perpAngle) * tipWidth
    )
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.filter = 'blur(6px)'
    ctx.globalAlpha = 0.2
    ctx.fillStyle = '#1a1a2e'
    ctx.fill()
    ctx.filter = 'none'

    ctx.restore()
  }, [centerX, centerY, dialRadius])

  const drawSun = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const sunX = width - 80
    const sunY = 80
    const sunRadius = 25

    const haloGradient = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 3)
    haloGradient.addColorStop(0, 'rgba(255, 230, 100, 0.6)')
    haloGradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.3)')
    haloGradient.addColorStop(1, 'rgba(255, 180, 0, 0)')

    ctx.fillStyle = haloGradient
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunRadius * 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffdd55'
    ctx.shadowBlur = 20
    ctx.shadowColor = '#ffdd55'
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.001
      const dist = sunRadius * 1.8 + Math.sin(time * 0.002 + i) * 8
      const px = sunX + Math.cos(angle) * dist
      const py = sunY + Math.sin(angle) * dist
      const size = 1.5 + Math.sin(time * 0.003 + i * 0.5) * 1

      ctx.fillStyle = `rgba(255, 230, 100, ${0.4 + Math.sin(time * 0.002 + i) * 0.3})`
      ctx.beginPath()
      ctx.arc(px, py, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [width])

  const drawCracks = useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    if (progress <= 0 || crackLines.length === 0) return

    ctx.strokeStyle = '#0a0a1a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    for (let i = 0; i < crackLines.length; i++) {
      const line = crackLines[i]
      const t = Math.min(1, progress * (crackLines.length / 6) - i * 0.15)
      if (t <= 0) continue

      const currentX = line.x1 + (line.x2 - line.x1) * t
      const currentY = line.y1 + (line.y2 - line.y1) * t

      ctx.beginPath()
      ctx.moveTo(line.x1, line.y1)
      ctx.lineTo(currentX, currentY)
      ctx.stroke()
    }
  }, [crackLines])

  const drawChamberEntrance = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const pulse = 0.5 + Math.sin(time * 0.003) * 0.3
    const chamberRadius = dialRadius * 0.4

    const outerGlow = ctx.createRadialGradient(centerX, centerY, chamberRadius * 0.5, centerX, centerY, chamberRadius * 2)
    outerGlow.addColorStop(0, `rgba(50, 100, 200, ${pulse * 0.8})`)
    outerGlow.addColorStop(0.5, 'rgba(30, 60, 150, 0.4)')
    outerGlow.addColorStop(1, 'rgba(10, 20, 80, 0)')

    ctx.fillStyle = outerGlow
    ctx.beginPath()
    ctx.arc(centerX, centerY, chamberRadius * 2, 0, Math.PI * 2)
    ctx.fill()

    const innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, chamberRadius)
    innerGradient.addColorStop(0, '#050530')
    innerGradient.addColorStop(0.7, '#0a0a50')
    innerGradient.addColorStop(1, '#1a1a70')

    ctx.fillStyle = innerGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, chamberRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `rgba(100, 150, 255, ${0.5 + pulse * 0.5})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, chamberRadius, 0, Math.PI * 2)
    ctx.stroke()

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + time * 0.001
      const r = chamberRadius * 0.3 + Math.sin(time * 0.002 + i) * chamberRadius * 0.2
      const sx = centerX + Math.cos(angle) * r
      const sy = centerY + Math.sin(angle) * r
      
      ctx.fillStyle = `rgba(150, 200, 255, ${0.3 + Math.sin(time * 0.003 + i) * 0.3})`
      ctx.beginPath()
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [centerX, centerY, dialRadius])

  const generateCrackLines = useCallback(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
    const numCracks = 8
    
    for (let i = 0; i < numCracks; i++) {
      const angle = (i / numCracks) * Math.PI * 2 + Math.random() * 0.3
      let x1 = centerX
      let y1 = centerY
      
      const segments = 3 + Math.floor(Math.random() * 3)
      for (let j = 0; j < segments; j++) {
        const dist = dialRadius * (0.3 + (j / segments) * 0.6)
        const wobble = (Math.random() - 0.5) * 30
        const x2 = centerX + Math.cos(angle + wobble * 0.01) * dist + wobble
        const y2 = centerY + Math.sin(angle + wobble * 0.01) * dist + wobble
        
        lines.push({ x1, y1, x2, y2 })
        x1 = x2
        y1 = y2
      }
    }
    
    setCrackLines(lines)
  }, [centerX, centerY, dialRadius])

  const checkUnlock = useCallback((angle: number) => {
    const seasons: Array<'winter' | 'spring' | 'summer' | 'autumn'> = ['winter', 'spring', 'summer', 'autumn']
    
    for (const season of seasons) {
      if (!unlockedCharts[season] && isAngleInUnlockZone(angle, season)) {
        unlockChart(season)
        setUnlockAnimation(season)
        
        if (particleSystemRef.current) {
          particleSystemRef.current.spawnUnlockParticles(
            centerX,
            centerY,
            SEASON_COLORS[season],
            50
          )
        }
        
        setTimeout(() => setUnlockAnimation(null), 1500)
        break
      }
    }
  }, [unlockedCharts, unlockChart, centerX, centerY])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (gamePhase !== 'playing') return
    isDraggingRef.current = true
    (e.target as HTMLElement).setPointerCapture(e.pointerId)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const angle = Math.atan2(y - centerY, x - centerX)
    setShadowAngle(angle)
  }, [centerX, centerY, setShadowAngle, gamePhase])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || gamePhase !== 'playing') return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const angle = Math.atan2(y - centerY, x - centerX)
    setShadowAngle(angle)
    checkUnlock(angle)
  }, [centerX, centerY, setShadowAngle, checkUnlock, gamePhase])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  const handleChamberClick = useCallback(() => {
    if (gamePhase === 'chamber-opening') {
      useGameStore.getState().setGamePhase('achievement')
      useGameStore.getState().setAchievementTime(
        (Date.now() - useGameStore.getState().startTime) / 1000
      )
    }
  }, [gamePhase])

  useEffect(() => {
    if (gamePhase === 'chamber-opening' && crackLines.length === 0) {
      generateCrackLines()
    }
  }, [gamePhase, generateCrackLines, crackLines.length])

  useEffect(() => {
    if (gamePhase === 'chamber-opening') {
      const startTime = Date.now()
      const duration = 1500
      
      const animateCrack = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(1, elapsed / duration)
        setCrackProgress(progress)
        
        if (progress < 1) {
          requestAnimationFrame(animateCrack)
        }
      }
      
      animateCrack()
    }
  }, [gamePhase])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = width
    canvas.height = height

    const particleCanvas = particleCanvasRef.current
    if (particleCanvas) {
      particleCanvas.width = width
      particleCanvas.height = height
      
      if (!particleSystemRef.current) {
        particleSystemRef.current = new ParticleSystem()
      }
      particleSystemRef.current.setCanvas(particleCanvas)
      particleSystemRef.current.start()
    }

    let startTime = performance.now()

    const render = (time: number) => {
      const elapsed = time - startTime
      
      ctx.clearRect(0, 0, width, height)

      const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
      bgGradient.addColorStop(0, '#1a1a3e')
      bgGradient.addColorStop(0.5, '#2d1f4e')
      bgGradient.addColorStop(1, '#1a0f3a')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      drawSun(ctx, elapsed)

      drawDial(ctx)
      drawShichenMarks(ctx)
      drawShadow(ctx, shadowAngle)
      drawGnomon(ctx)

      if (gamePhase === 'chamber-opening') {
        drawCracks(ctx, crackProgress)
        if (crackProgress >= 1) {
          drawChamberEntrance(ctx, elapsed)
        }
      }

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (particleSystemRef.current) {
        particleSystemRef.current.stop()
      }
    }
  }, [width, height, shadowAngle, gamePhase, crackProgress, drawDial, drawShichenMarks, drawGnomon, drawShadow, drawSun, drawCracks, drawChamberEntrance])

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: gamePhase === 'playing' ? 'grab' : 'default',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleChamberClick}
      />
      <canvas
        ref={particleCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
      {unlockAnimation && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '32px',
            fontWeight: 'bold',
            color: SEASON_COLORS[unlockAnimation],
            textShadow: `0 0 20px ${SEASON_COLORS[unlockAnimation]}`,
            animation: 'unlockPulse 1.5s ease-out',
            pointerEvents: 'none',
          }}
        >
          {SEASON_NAMES[unlockAnimation]}星图已解锁
        </div>
      )}
      <style>{`
        @keyframes unlockPulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  )
}
