import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useCastingStore } from '@/store'
import './Furnace.css'

interface FlameParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

export default function Furnace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<FlameParticle[]>([])
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const mixture = useCastingStore(state => state.mixture)
  const updateMixture = useCastingStore(state => state.updateMixture)
  const pourMold = useCastingStore(state => state.pourMold)

  const isReady = mixture.copperRatio >= 85 &&
    mixture.temperature >= 900 &&
    mixture.temperature <= 1000

  const metalColor = isReady ? '#ffd700' : '#cc4400'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const createParticle = (): FlameParticle => {
      const centerX = canvas.width / 2
      const baseY = canvas.height * 0.8
      const hue = 30 + Math.random() * 20
      const saturation = 100
      const lightness = 50 + Math.random() * 20

      return {
        x: centerX + (Math.random() - 0.5) * 40,
        y: baseY,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 3,
        life: 1,
        maxLife: 30 + Math.random() * 20,
        size: 3 + Math.random() * 5,
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`
      }
    }

    const animate = (time: number) => {
      if (time - lastTimeRef.current < 33) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastTimeRef.current = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (particlesRef.current.length < 50) {
        particlesRef.current.push(createParticle())
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.05
        p.life -= 1 / p.maxLife

        if (p.life <= 0) return false

        const alpha = p.life
        const size = p.size * p.life

        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla')
        ctx.fill()

        return true
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleCopperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    updateMixture({ copperRatio: value })
  }

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    updateMixture({ temperature: value })
  }

  return (
    <div className="furnace-container">
      <div className="furnace-scene">
        <div className="furnace-body">
          <div className="furnace-chimney" />
          <div className="furnace-main">
            <div className="furnace-opening">
              <canvas
                ref={canvasRef}
                width={120}
                height={100}
                className="flame-canvas"
              />
              <div
                className="molten-metal"
                style={{
                  background: `radial-gradient(ellipse at center, ${metalColor} 0%, ${isReady ? '#ffaa00' : '#992200'} 70%, ${isReady ? '#cc8800' : '#661100'} 100%)`
                }}
              />
            </div>
            <div
              className="pour-spout"
              onClick={pourMold}
              style={{ cursor: isReady ? 'pointer' : 'not-allowed' }}
            >
              {isReady && <span className="pour-hint">点击浇铸</span>}
            </div>
          </div>
        </div>

        <div className="bellows-container">
          <motion.div
            className="bellows"
            animate={{ x: [0, -15, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="bellows-body" />
            <div className="bellows-handle" />
          </motion.div>
        </div>
      </div>

      <div className="controls-panel">
        <div className="control-group">
          <div className="control-label">
            <span className="seal-text">铜锡比例</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min={80}
              max={95}
              value={mixture.copperRatio}
              onChange={handleCopperChange}
              className="custom-slider"
            />
            <div className="slider-values">
              <span>铜 {mixture.copperRatio}%</span>
              <span>锡 {mixture.tinRatio}%</span>
            </div>
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">
            <span className="seal-text">炉温控制</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min={700}
              max={1100}
              value={mixture.temperature}
              onChange={handleTempChange}
              className="custom-slider"
            />
            <div className="temp-display">
              <span className="temp-value seal-text">{mixture.temperature}°C</span>
            </div>
          </div>
        </div>

        <div className={`status-indicator ${isReady ? 'ready' : 'not-ready'}`}>
          <span className="seal-text">
            {isReady ? '铜液已熔，可以浇铸' : '调整配比与温度'}
          </span>
        </div>
      </div>
    </div>
  )
}
