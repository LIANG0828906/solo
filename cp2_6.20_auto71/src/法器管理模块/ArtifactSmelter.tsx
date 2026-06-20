import React, { useState, useRef, useEffect, useCallback } from 'react'
import { type ElementType, isSheng, isKe, calculateArtifactFinalStats } from '@/utils/elementEngine'
import { type BaseArtifact, type SmeltedArtifact, calculateArtifactStats, saveSmeltedArtifact } from '@/utils/api'

const ELEMENT_COLORS: Record<ElementType, string> = {
  metal: '#c0c0c0',
  wood: '#4caf50',
  water: '#2196f3',
  fire: '#f44336',
  earth: '#ff9800',
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
}

const ELEMENT_STAT_MAP: Record<ElementType, 'attack' | 'defense' | 'speed'> = {
  metal: 'attack',
  wood: 'defense',
  water: 'speed',
  fire: 'attack',
  earth: 'defense',
}

interface ParticleData {
  id: number
  startX: number
  startY: number
  targetX: number
  targetY: number
  controlX: number
  controlY: number
  color: string
  startTime: number
  duration: number
}

function bezierPoint(t: number, p0: number, p1: number, p2: number): number {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2
}

function getHolePosition(index: number, centerX: number, centerY: number, radius: number) {
  const angle = (index * 60 - 90) * (Math.PI / 180)
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  }
}

const DURATION_PARTICLE = 800
const PARTICLE_COUNT = 20
const BURST_DURATION = 5000
const ENERGY_RATE = 50

interface ArtifactSmelterProps {
  artifact: BaseArtifact
  activatedElements: ElementType[]
  resonationBoost: number
  onSave: (artifact: SmeltedArtifact) => void
  onBack: () => void
}

const ArtifactSmelter = React.memo(function ArtifactSmelter({
  artifact,
  activatedElements,
  resonationBoost,
  onSave,
  onBack,
}: ArtifactSmelterProps) {
  const [soulHoles, setSoulHoles] = useState<(ElementType | null)[]>([null, null, null, null, null, null])
  const [draggingElement, setDraggingElement] = useState<ElementType | null>(null)
  const [particles, setParticles] = useState<ParticleData[]>([])
  const [isRotating, setIsRotating] = useState(false)
  const [finalStats, setFinalStats] = useState<{ attack: number; defense: number; speed: number } | null>(null)
  const [energyDisplay, setEnergyDisplay] = useState(0)
  const [showBurst, setShowBurst] = useState(false)
  const [burstBoost, setBurstBoost] = useState(0)
  const [particleTick, setParticleTick] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleAnimRef = useRef<number>(0)
  const burstAnimRef = useRef<number>(0)
  const rippleAnimRef = useRef<number>(0)
  const particleIdRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const holeRefs = useRef<(HTMLDivElement | null)[]>([])
  const elementRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const filledCount = soulHoles.filter((h): h is ElementType => h !== null).length

  const recalcStats = useCallback(() => {
    const result = calculateArtifactFinalStats(
      artifact.baseStats,
      soulHoles,
      resonationBoost + burstBoost,
    )
    setFinalStats(result.finalStats)
  }, [artifact.baseStats, soulHoles, resonationBoost, burstBoost])

  useEffect(() => {
    recalcStats()
  }, [recalcStats])

  useEffect(() => {
    if (filledCount === 6 && !showBurst) {
      setShowBurst(true)
    }
  }, [filledCount, showBurst])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true
    const startTime = performance.now()

    const draw = () => {
      if (!running || !ctx) return
      const time = performance.now() - startTime
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      const filledEls = soulHoles.filter((e): e is ElementType => e !== null)
      if (filledEls.length === 0) {
        rippleAnimRef.current = requestAnimationFrame(draw)
        return
      }

      const colors = filledEls.map((e) => ELEMENT_COLORS[e])
      const gradient = ctx.createLinearGradient(0, 0, w, 0)
      colors.forEach((c, i) => {
        gradient.addColorStop(i / Math.max(colors.length - 1, 1), c)
      })
      if (colors.length === 1) {
        gradient.addColorStop(1, colors[0])
      }

      const opacity = 0.3 + 0.15 * Math.sin(time * 0.002)
      ctx.globalAlpha = opacity
      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * 0.05 + time * 0.003) * 10
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1

      rippleAnimRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      running = false
      cancelAnimationFrame(rippleAnimRef.current)
    }
  }, [soulHoles])

  useEffect(() => {
    if (particles.length === 0) return

    const animate = () => {
      const now = performance.now()
      const allDone = particles.every((p) => now - p.startTime > p.duration)
      if (allDone) {
        setParticles([])
        return
      }
      setParticleTick((t) => t + 1)
      particleAnimRef.current = requestAnimationFrame(animate)
    }

    particleAnimRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(particleAnimRef.current)
  }, [particles.length > 0])

  useEffect(() => {
    if (!showBurst) return

    const totalEnergy = soulHoles.filter((h): h is ElementType => h !== null).length * 100
    const startTime = performance.now()

    const animate = () => {
      const elapsed = performance.now() - startTime
      const current = Math.min(ENERGY_RATE * (elapsed / 1000), totalEnergy)
      setEnergyDisplay(Math.round(current))

      if (elapsed < BURST_DURATION) {
        burstAnimRef.current = requestAnimationFrame(animate)
      } else {
        setEnergyDisplay(totalEnergy)
        setSoulHoles([null, null, null, null, null, null])
        setBurstBoost((prev) => prev + 5)
        setShowBurst(false)
      }
    }

    burstAnimRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(burstAnimRef.current)
  }, [showBurst])

  useEffect(() => {
    if (!isRotating) return
    const timer = setTimeout(() => setIsRotating(false), 2000)
    return () => clearTimeout(timer)
  }, [isRotating])

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, element: ElementType) => {
    setDraggingElement(element)
    e.dataTransfer.setData('text/plain', element)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((holeIndex: number, element: ElementType) => {
    setSoulHoles((prev) => {
      const next = [...prev]
      next[holeIndex] = element
      return next
    })

    setIsRotating(true)

    const containerRect = containerRef.current?.getBoundingClientRect()
    const holeEl = holeRefs.current[holeIndex]
    const elementEl = elementRefs.current[element]

    if (containerRect && holeEl && elementEl) {
      const holeRect = holeEl.getBoundingClientRect()
      const elementRect = elementEl.getBoundingClientRect()

      const targetX = holeRect.left + holeRect.width / 2 - containerRect.left
      const targetY = holeRect.top + holeRect.height / 2 - containerRect.top
      const startX = elementRect.left + elementRect.width / 2 - containerRect.left
      const startY = elementRect.top + elementRect.height / 2 - containerRect.top

      const midX = (startX + targetX) / 2
      const midY = (startY + targetY) / 2

      const now = performance.now()
      const newParticles: ParticleData[] = Array.from({ length: PARTICLE_COUNT }, () => {
        const offsetY = (Math.random() - 0.5) * 100
        return {
          id: particleIdRef.current++,
          startX,
          startY,
          targetX,
          targetY,
          controlX: midX + (Math.random() - 0.5) * 20,
          controlY: midY + offsetY,
          color: ELEMENT_COLORS[element],
          startTime: now + Math.random() * 100,
          duration: DURATION_PARTICLE,
        }
      })

      setParticles(newParticles)
    }

    setDraggingElement(null)
  }, [])

  const handleComplete = useCallback(async () => {
    const result = calculateArtifactFinalStats(
      artifact.baseStats,
      soulHoles,
      resonationBoost + burstBoost,
    )

    const smelted: SmeltedArtifact = {
      ...artifact,
      smeltedId: `smelted_${artifact.id}_${Date.now()}`,
      soulHoles,
      finalStats: result.finalStats,
      mainElement: result.mainElement,
      bonuses: result.bonuses,
      smeltedAt: new Date().toISOString(),
      resonationBoost: resonationBoost + burstBoost,
    }

    try {
      const saved = await saveSmeltedArtifact(smelted)
      onSave(saved)
    } catch {
      onSave(smelted)
    }
  }, [artifact, soulHoles, resonationBoost, burstBoost, onSave])

  const filledElements = soulHoles.filter((h): h is ElementType => h !== null)
  const holographicColors = filledElements.map((e) => ELEMENT_COLORS[e])
  const holographicGradient =
    holographicColors.length >= 2
      ? `linear-gradient(45deg, ${holographicColors.join(', ')})`
      : holographicColors.length === 1
        ? `linear-gradient(45deg, ${holographicColors[0]}, ${holographicColors[0]}88)`
        : 'none'

  void particleTick

  const now = performance.now()

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', minHeight: '600px', userSelect: 'none' }}
    >
      {showBurst && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%) scale(1)',
            zIndex: 50,
            textAlign: 'center',
            animation: 'burstScaleIn 0.5s ease-out forwards',
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              background: 'linear-gradient(90deg, #ffdf00, #ff8800)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              borderRadius: 8,
            }}
          >
            共振爆发！
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#ffdf00',
              marginTop: 8,
              fontFamily: 'sans-serif',
            }}
          >
            {energyDisplay}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 32, paddingTop: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activatedElements.map((el) => (
            <div
              key={el}
              ref={(r) => { elementRefs.current[el] = r }}
              draggable
              onDragStart={(e) => handleDragStart(e, el)}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${ELEMENT_COLORS[el]}cc, ${ELEMENT_COLORS[el]}66)`,
                border: `2px solid ${ELEMENT_COLORS[el]}`,
                cursor: draggingElement === el ? 'grabbing' : 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                willChange: 'transform',
                opacity: draggingElement === el ? 0.5 : 1,
                transition: 'opacity 0.2s',
                boxShadow: `0 0 12px ${ELEMENT_COLORS[el]}88`,
              }}
            >
              {ELEMENT_LABELS[el]}
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', width: 300, height: 300 }}>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${isRotating ? 5 : 0}deg)`,
              transition: 'transform 0.3s ease-out',
              willChange: 'transform',
            }}
          >
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 16,
                  background: `url(${artifact.icon}) center/cover, linear-gradient(135deg, #2a2a3e, #1a1a2e)`,
                  border: '2px solid #555',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ccc',
                  fontSize: 12,
                  overflow: 'hidden',
                }}
              >
                {!artifact.icon && artifact.name.slice(0, 2)}
              </div>

              {holographicGradient !== 'none' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 16,
                    background: holographicGradient,
                    mixBlendMode: 'overlay',
                    opacity: 0.3,
                    animation: 'holographicPulse 2s ease-in-out infinite',
                    willChange: 'transform, opacity',
                    pointerEvents: 'none',
                  }}
                />
              )}

              <canvas
                ref={canvasRef}
                width={120}
                height={120}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 16,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {soulHoles.map((hole, i) => {
            const pos = getHolePosition(i, 150, 150, 100)
            return (
              <div
                key={i}
                ref={(r) => { holeRefs.current[i] = r }}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.preventDefault()
                  const el = e.dataTransfer.getData('text/plain') as ElementType
                  if (el) handleDrop(i, el)
                }}
                style={{
                  position: 'absolute',
                  left: pos.x - 25,
                  top: pos.y - 25,
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  border: hole ? `2px solid ${ELEMENT_COLORS[hole]}` : '2px dashed #555',
                  background: hole
                    ? `radial-gradient(circle at 35% 35%, ${ELEMENT_COLORS[hole]}aa, ${ELEMENT_COLORS[hole]}44)`
                    : 'rgba(30, 30, 50, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  willChange: 'transform',
                  transition: 'all 0.3s ease',
                  boxShadow: hole ? `0 0 16px ${ELEMENT_COLORS[hole]}88` : 'none',
                  cursor: 'default',
                }}
              >
                {hole ? ELEMENT_LABELS[hole] : ''}
              </div>
            )
          })}
        </div>

        <div
          style={{
            minWidth: 180,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(20, 20, 40, 0.9)',
            border: '1px solid #444',
          }}
        >
          <h3 style={{ color: '#ccc', fontSize: 14, marginBottom: 12, fontWeight: 600 }}>属性对比</h3>

          {(['attack', 'defense', 'speed'] as const).map((stat) => {
            const base = artifact.baseStats[stat]
            const final = finalStats ? finalStats[stat] : base
            const diff = final - base
            const label = stat === 'attack' ? '攻击' : stat === 'defense' ? '防御' : '速度'

            return (
              <div key={stat} style={{ marginBottom: 8 }}>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ color: '#aaa', fontSize: 14 }}>{base}</span>
                  <span style={{ color: '#666' }}>→</span>
                  <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{Math.round(final * 100) / 100}</span>
                  {diff !== 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        color: diff > 0 ? '#4caf50' : '#f44336',
                        fontWeight: 600,
                      }}
                    >
                      {diff > 0 ? '+' : ''}{Math.round(diff * 100) / 100}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {filledElements.length > 0 && (
            <div style={{ marginTop: 12, borderTop: '1px solid #333', paddingTop: 8 }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>相生/相克</div>
              {filledElements.map((el, idx) => {
                const freq: Record<string, number> = {}
                filledElements.forEach((e) => { freq[e] = (freq[e] || 0) + 1 })
                let mainEl: ElementType = filledElements[0]
                filledElements.forEach((e) => { if ((freq[e] || 0) > (freq[mainEl] || 0)) mainEl = e })

                if (el === mainEl) return null

                const sheng = isSheng(el, mainEl)
                const ke = isKe(el, mainEl)
                if (!sheng && !ke) return null

                return (
                  <div
                    key={`${el}-${idx}`}
                    style={{
                      fontSize: 11,
                      color: sheng ? '#4caf50' : '#f44336',
                      marginBottom: 2,
                    }}
                  >
                    {ELEMENT_LABELS[el]} {sheng ? '→生→' : '→克→'} {ELEMENT_LABELS[mainEl]}
                    {sheng && ` +${Math.round(artifact.baseStats[ELEMENT_STAT_MAP[el]] * 20) / 100}`}
                    {ke && ` -${Math.round(artifact.baseStats[ELEMENT_STAT_MAP[el]] * 15) / 100}`}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={handleComplete}
          disabled={filledCount < 6 || showBurst}
          style={{
            padding: '12px 36px',
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 8,
            border: 'none',
            cursor: filledCount < 6 || showBurst ? 'not-allowed' : 'pointer',
            background: filledCount >= 6 && !showBurst
              ? 'linear-gradient(135deg, #ff8800, #ffdf00)'
              : '#333',
            color: filledCount >= 6 && !showBurst ? '#1a1a2e' : '#666',
            transition: 'all 0.3s',
          }}
        >
          完成熔炼
        </button>
        <button
          onClick={onBack}
          style={{
            marginLeft: 12,
            padding: '12px 24px',
            fontSize: 14,
            borderRadius: 8,
            border: '1px solid #555',
            background: 'transparent',
            color: '#999',
            cursor: 'pointer',
          }}
        >
          返回
        </button>
      </div>

      {particles.map((p) => {
        const elapsed = now - p.startTime
        const t = Math.min(Math.max(elapsed / p.duration, 0), 1)
        const x = bezierPoint(t, p.startX, p.controlX, p.targetX)
        const y = bezierPoint(t, p.startY, p.controlY, p.targetY)
        const opacity = 1 - t

        if (opacity <= 0) return null

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: x - 3,
              top: y - 3,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: p.color,
              opacity,
              pointerEvents: 'none',
              willChange: 'transform, opacity',
            }}
          />
        )
      })}

      <style>{`
        @keyframes burstScaleIn {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          70% { transform: translateX(-50%) scale(1.1); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes holographicPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
})

export default ArtifactSmelter
