import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import './WishingPool.css'

interface Bottle {
  id: string
  x: number
  y: number
  targetX: number
  targetY: number
  duration: number
  startTime: number
  delay: number
}

interface Ripple {
  id: string
  x: number
  y: number
  startTime: number
}

interface Particle {
  id: string
  x: number
  y: number
  startTime: number
  color: string
  angle: number
  radius: number
  speed: number
}

interface WishParticleGroup {
  id: string
  x: number
  y: number
  startTime: number
  particles: Particle[]
  text: string
}

const PARTICLE_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C084FC']

const MAX_BOTTLES = 15

interface WishingPoolProps {
  onCoinDrop?: (x: number, y: number) => void
  onWishSubmit?: (content: string, x: number, y: number) => void
}

export interface WishingPoolRef {
  spawnBottle: () => void
}

export const WishingPool = forwardRef<WishingPoolRef, WishingPoolProps>(
  function WishingPool({ onCoinDrop, onWishSubmit }, ref) {
  const poolRef = useRef<HTMLDivElement>(null)
  const [bottles, setBottles] = useState<Bottle[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [wishGroups, setWishGroups] = useState<WishParticleGroup[]>([])
  const [wishInput, setWishInput] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const animationRef = useRef<number>()
  const bottleIdRef = useRef(0)

  const getPoolCenter = useCallback(() => {
    if (!poolRef.current) return { x: 0, y: 0, radius: 0 }
    const rect = poolRef.current.getBoundingClientRect()
    return {
      x: rect.width / 2,
      y: rect.height / 2,
      radius: rect.width / 2 - 20,
    }
  }, [])

  const getRandomPoolPosition = useCallback(() => {
    const { radius } = getPoolCenter()
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * radius * 0.6
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    }
  }, [getPoolCenter])

  const getEdgeTarget = useCallback((startX: number, startY: number) => {
    const { radius } = getPoolCenter()
    const angle = Math.atan2(startY, startX) + (Math.random() - 0.5) * 0.5
    const targetRadius = radius * 0.85
    return {
      x: Math.cos(angle) * targetRadius,
      y: Math.sin(angle) * targetRadius,
    }
  }, [getPoolCenter])

  const spawnBottle = useCallback(() => {
    const { x, y } = getRandomPoolPosition()
    const target = getEdgeTarget(x, y)
    const duration = 10000 + Math.random() * 5000

    const bottle: Bottle = {
      id: `bottle-${bottleIdRef.current++}`,
      x,
      y,
      targetX: target.x,
      targetY: target.y,
      duration,
      startTime: performance.now(),
      delay: 0,
    }

    setBottles((prev) => {
      const next = [...prev, bottle]
      if (next.length > MAX_BOTTLES) {
        return next.slice(next.length - MAX_BOTTLES)
      }
      return next
    })
  }, [getRandomPoolPosition, getEdgeTarget])

  const spawnRipple = useCallback((x: number, y: number) => {
    const ripple: Ripple = {
      id: `ripple-${Date.now()}-${Math.random()}`,
      x,
      y,
      startTime: performance.now(),
    }
    setRipples((prev) => [...prev, ripple])
  }, [])

  useImperativeHandle(ref, () => ({
    spawnBottle: () => {
      spawnBottle()
      const pos = getRandomPoolPosition()
      spawnRipple(pos.x, pos.y)
    },
  }))

  const spawnWishParticles = useCallback((x: number, y: number, text: string) => {
    const particles: Particle[] = []
    const count = 10 + Math.floor(Math.random() * 6)
    for (let i = 0; i < count; i++) {
      particles.push({
        id: `p-${i}-${Math.random()}`,
        x: 0,
        y: 0,
        startTime: performance.now() + i * 80,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        radius: 20 + Math.random() * 30,
        speed: 0.5 + Math.random() * 0.5,
      })
    }

    const group: WishParticleGroup = {
      id: `wish-${Date.now()}-${Math.random()}`,
      x,
      y,
      startTime: performance.now(),
      particles,
      text,
    }
    setWishGroups((prev) => [...prev, group])
  }, [])

  const handleCoinClick = useCallback(() => {
    const pos = getRandomPoolPosition()
    spawnBottle()
    spawnRipple(pos.x, pos.y)
    onCoinDrop?.(pos.x, pos.y)
  }, [getRandomPoolPosition, spawnBottle, spawnRipple, onCoinDrop])

  const handleWishSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const content = wishInput.trim()
      if (!content) return
      if (content.length > 100) return

      const pos = getRandomPoolPosition()
      spawnRipple(pos.x, pos.y)
      spawnWishParticles(pos.x, pos.y, content)
      onWishSubmit?.(content, pos.x, pos.y)
      setWishInput('')
    },
    [wishInput, getRandomPoolPosition, spawnRipple, spawnWishParticles, onWishSubmit]
  )

  useEffect(() => {
    const animate = () => {
      const now = performance.now()

      setBottles((prev) =>
        prev.filter((b) => now - b.startTime < b.duration + 500)
      )

      setRipples((prev) => prev.filter((r) => now - r.startTime < 1500))

      setWishGroups((prev) => prev.filter((g) => now - g.startTime < 5000))

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const renderBottle = (bottle: Bottle) => {
    const now = performance.now()
    const elapsed = now - bottle.startTime
    const progress = Math.min(elapsed / bottle.duration, 1)

    const emergeProgress = Math.min(elapsed / 500, 1)
    const emergeEase = 1 - Math.pow(1 - emergeProgress, 3)

    const fadeProgress = Math.max((elapsed - bottle.duration + 500) / 500, 0)
    const opacity = emergeEase * (1 - fadeProgress * 0.8)

    const currentX = bottle.x + (bottle.targetX - bottle.x) * progress
    const currentY = bottle.y + (bottle.targetY - bottle.y) * progress

    const floatY = Math.sin(elapsed / 800 + bottle.x) * 3

    const rotation = Math.atan2(bottle.targetY - bottle.y, bottle.targetX - bottle.x) * (180 / Math.PI)

    return (
      <div
        key={bottle.id}
        className="drift-bottle"
        style={{
          left: `calc(50% + ${currentX}px)`,
          top: `calc(50% + ${currentY + floatY}px)`,
          opacity,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(${(1 - emergeEase) * 30}px)`,
        }}
      >
        <div className="bottle-glow" />
        <div className="bottle-body">
          <div className="bottle-sparkle" />
        </div>
      </div>
    )
  }

  const renderRipple = (ripple: Ripple) => {
    const now = performance.now()
    const elapsed = now - ripple.startTime
    const progress = elapsed / 1500
    if (progress > 1) return null

    const size = 10 + progress * 120
    const opacity = (1 - progress) * 0.8

    return (
      <div
        key={ripple.id}
        className="ripple"
        style={{
          left: `calc(50% + ${ripple.x}px)`,
          top: `calc(50% + ${ripple.y}px)`,
          width: `${size}px`,
          height: `${size}px`,
          opacity,
          transform: 'translate(-50%, -50%)',
        }}
      />
    )
  }

  const renderWishParticles = (group: WishParticleGroup) => {
    const now = performance.now()
    const totalElapsed = now - group.startTime
    if (totalElapsed > 5000) return null

    const fadeOut = Math.max((totalElapsed - 4000) / 1000, 0)
    const baseOpacity = 1 - fadeOut

    const riseY = -totalElapsed * 0.04

    return (
      <div
        key={group.id}
        className="wish-particles"
        style={{
          left: `calc(50% + ${group.x}px)`,
          top: `calc(50% + ${group.y + riseY}px)`,
          opacity: baseOpacity,
        }}
      >
        {group.particles.map((p) => {
          const pElapsed = now - p.startTime
          if (pElapsed < 0) return null
          const t = pElapsed / 5000
          const spiralAngle = p.angle + t * Math.PI * 2 * p.speed
          const spiralRadius = p.radius * (1 + t * 0.5)
          const px = Math.cos(spiralAngle) * spiralRadius
          const py = Math.sin(spiralAngle) * spiralRadius - t * 100

          const pFade = Math.max((pElapsed - 3500) / 1500, 0)
          const pOpacity = (1 - pFade) * baseOpacity

          return (
            <div
              key={p.id}
              className="particle"
              style={{
                left: `${px}px`,
                top: `${py}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 6px ${p.color}, 0 0 12px ${p.color}`,
                opacity: pOpacity,
              }}
            />
          )
        })}
        <div
          className="wish-text"
          style={{
            opacity: baseOpacity * (totalElapsed > 500 ? Math.min((totalElapsed - 500) / 500, 1) : 0),
          }}
        >
          {group.text}
        </div>
      </div>
    )
  }

  return (
    <div className="wishing-pool-wrapper">
      <div className="pool-container" ref={poolRef}>
        <div className="pool-rim">
          <div className="pool-rim-inner" />
        </div>

        <div className="pool-water">
          <div className="wave wave-1" />
          <div className="wave wave-2" />
          <div className="wave wave-3" />

          <div className="pool-center-light" />

          {ripples.map(renderRipple)}
          {bottles.map(renderBottle)}
          {wishGroups.map(renderWishParticles)}
        </div>
      </div>

      <form className="wish-input-container" onSubmit={handleWishSubmit}>
        <input
          type="text"
          className={`wish-input ${isInputFocused ? 'focused' : ''}`}
          placeholder="写下你的心愿..."
          value={wishInput}
          onChange={(e) => setWishInput(e.target.value.slice(0, 100))}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          maxLength={100}
        />
        <button type="submit" className="wish-submit-btn" disabled={!wishInput.trim()}>
          投放
        </button>
        <span className="wish-count">{wishInput.length}/100</span>
      </form>

      <button className="pool-coin-trigger" onClick={handleCoinClick} aria-label="投放许愿币">
        +
      </button>
    </div>
  )
}
