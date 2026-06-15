import { useEffect, useRef, useState } from 'react'
import { useCastingStore } from '@/store'
import { CastingPhase } from '@/types'
import './CastingAnimation.css'

interface PourParticle {
  progress: number
  offset: number
  size: number
  speed: number
}

export default function CastingAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<PourParticle[]>([])
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const [pourProgress, setPourProgress] = useState(0)
  const [isCooling, setIsCooling] = useState(false)

  const pourFlag = useCastingStore(state => state.pourFlag)
  const coolingProgress = useCastingStore(state => state.coolingProgress)
  const mixture = useCastingStore(state => state.mixture)
  const phase = useCastingStore(state => state.phase)
  const sword = useCastingStore(state => state.sword)
  const updateCoolingProgress = useCastingStore(state => state.updateCoolingProgress)
  const finishCasting = useCastingStore(state => state.finishCasting)

  const isActive = phase === CastingPhase.Casting || pourFlag

  useEffect(() => {
    if (!pourFlag || isCooling) return

    let particleTimer: ReturnType<typeof setInterval>
    let pourTimer: ReturnType<typeof setTimeout>

    particleTimer = setInterval(() => {
      if (particlesRef.current.length < 30) {
        particlesRef.current.push({
          progress: 0,
          offset: Math.random() * 10 - 5,
          size: 4 + Math.random() * 4,
          speed: 0.015 + Math.random() * 0.01
        })
      }
    }, 50)

    pourTimer = setTimeout(() => {
      clearInterval(particleTimer)
      setPourProgress(100)
      setIsCooling(true)
    }, 3000)

    return () => {
      clearInterval(particleTimer)
      clearTimeout(pourTimer)
    }
  }, [pourFlag, isCooling])

  useEffect(() => {
    if (!isCooling) return

    const coolDuration = 5000 + (mixture.roomTemperature - 20) * 200
    const startTime = Date.now()

    const coolInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, (elapsed / coolDuration) * 100)
      updateCoolingProgress(progress)

      if (progress >= 100) {
        clearInterval(coolInterval)
        setTimeout(() => {
          finishCasting()
          setIsCooling(false)
          setPourProgress(0)
          particlesRef.current = []
        }, 500)
      }
    }, 50)

    return () => clearInterval(coolInterval)
  }, [isCooling, mixture.roomTemperature, updateCoolingProgress, finishCasting])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !pourFlag) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const startX = 30
    const startY = 30
    const endX = canvas.width - 50
    const endY = canvas.height - 40
    const cp1x = startX + 80
    const cp1y = startY + 50
    const cp2x = endX - 60
    const cp2y = endY - 80

    const getPointOnCurve = (t: number, offset: number) => {
      const mt = 1 - t
      const x = mt * mt * mt * startX + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * endX
      const y = mt * mt * mt * startY + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * endY
      return { x: x + offset, y }
    }

    const animate = (time: number) => {
      if (time - lastTimeRef.current < 50) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastTimeRef.current = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (pourProgress < 100) {
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY)
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)'
        ctx.lineWidth = 8
        ctx.stroke()
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.progress += p.speed
        if (p.progress >= 1) return false

        const pos = getPointOnCurve(p.progress, p.offset)
        const alpha = 1 - p.progress * 0.5

        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size)
        gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`)
        gradient.addColorStop(0.5, `rgba(255, 170, 0, ${alpha * 0.8})`)
        gradient.addColorStop(1, `rgba(204, 68, 0, ${alpha * 0.5})`)

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        return true
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [pourFlag, pourProgress])

  const getMoldColor = () => {
    if (coolingProgress === 0) return '#b8a078'
    const hotR = 255
    const hotG = 102
    const hotB = 51
    const coldR = 102
    const coldG = 85
    const coldB = 68

    const t = coolingProgress / 100
    const r = Math.round(hotR + (coldR - hotR) * t)
    const g = Math.round(hotG + (coldG - hotG) * t)
    const b = Math.round(hotB + (coldB - hotB) * t)

    return `rgb(${r}, ${g}, ${b})`
  }

  if (!isActive && !sword.ingotRough) {
    return (
      <div className="casting-placeholder">
        <p className="seal-text">完成熔炼后可进行浇铸</p>
      </div>
    )
  }

  return (
    <div className="casting-container">
      <div className="casting-scene">
        <div className="pour-trough" />

        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="pour-canvas"
        />

        <div className="mold-wrapper">
          <div className="mold-half mold-left" style={{ background: getMoldColor() }}>
            <div className="sword-cavity" />
          </div>
          <div className="mold-half mold-right" style={{ background: getMoldColor() }}>
            <div className="sword-cavity" />
          </div>
          {coolingProgress > 0 && coolingProgress < 100 && (
            <div className="cooling-overlay">
              <div className="cooling-progress">
                <div
                  className="cooling-bar"
                  style={{ width: `${coolingProgress}%` }}
                />
              </div>
              <span className="cooling-text seal-text">
                冷却中 {coolingProgress.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="casting-info">
        <div className="info-item">
          <span className="info-label seal-text">室温</span>
          <span className="info-value">{mixture.roomTemperature.toFixed(1)}°C</span>
        </div>
        <div className="info-item">
          <span className="info-label seal-text">冷却速度</span>
          <span className="info-value">
            {mixture.roomTemperature < 25 ? '缓慢' : mixture.roomTemperature < 28 ? '适中' : '较快'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label seal-text">晶粒状态</span>
          <span className="info-value">
            {mixture.roomTemperature < 25 ? '粗大' : mixture.roomTemperature < 28 ? '适中' : '细密'}
          </span>
        </div>
      </div>
    </div>
  )
}
