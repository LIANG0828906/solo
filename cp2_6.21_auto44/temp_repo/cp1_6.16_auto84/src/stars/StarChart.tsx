import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../store/store'
import { starCharts, CHART_CANVAS_WIDTH, CHART_CANVAS_HEIGHT } from './StarData'
import { SEASON_COLORS, SEASON_NAMES } from '../sundial/SundialUtils'
import { ParticleSystem } from '../effects/Particles'

interface StarChartDisplayProps {
  season: string
  onClose: () => void
}

function StarChartDisplay({ season, onClose }: StarChartDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const animationRef = useRef<number | null>(null)
  const [clickedStars, setClickedStars] = useState<string[]>([])
  const [isShattering, setIsShattering] = useState(false)
  const [showFragment, setShowFragment] = useState(false)
  const [shatterProgress, setShatterProgress] = useState(0)
  const [shatterFragments, setShatterFragments] = useState<Array<{
    x: number; y: number; w: number; h: number;
    vx: number; vy: number; rot: number; rotSpeed: number;
    row: number; col: number
  }>>([])
  const collectFragment = useGameStore((state) => state.collectFragment)
  const collectedFragments = useGameStore((state) => state.collectedFragments)

  const chartData = starCharts[season]
  const gridSize = 15

  const playPingSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      oscillator.frequency.value = 880
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2)
      
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.2)
    } catch (e) {
    }
  }, [])

  const drawStars = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CHART_CANVAS_WIDTH, CHART_CANVAS_HEIGHT)

    chartData.stars.forEach((star) => {
      const isClicked = clickedStars.includes(star.id)
      const twinkle = 0.7 + Math.sin(time * 0.003 + star.x * 0.1) * 0.3
      const brightness = star.brightness * twinkle

      if (isClicked) {
        ctx.fillStyle = '#ffd700'
        ctx.shadowBlur = 15
        ctx.shadowColor = '#ffd700'
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
        ctx.shadowBlur = star.isSpecial ? 5 : 0
        ctx.shadowColor = '#ffffff'
      }

      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    chartData.constellations.forEach((constellation) => {
      const starPositions = constellation.stars
        .map((id) => chartData.stars.find((s) => s.id === id))
        .filter(Boolean) as typeof chartData.stars

      if (starPositions.length < 2) return

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.lineDashOffset = -time * 0.02

      ctx.beginPath()
      ctx.moveTo(starPositions[0].x, starPositions[0].y)
      for (let i = 1; i < starPositions.length; i++) {
        ctx.lineTo(starPositions[i].x, starPositions[i].y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    })

    chartData.constellations.forEach((constellation) => {
      const labelPos = chartData.constellationLabelPos
      const labelText = constellation.name

      ctx.font = '14px "Microsoft YaHei", sans-serif'
      const textWidth = ctx.measureText(labelText).width
      const padding = 6
      const rectWidth = textWidth + padding * 2
      const rectHeight = 22

      ctx.fillStyle = 'rgba(20, 40, 80, 0.7)'
      ctx.beginPath()
      const x = labelPos.x - rectWidth / 2
      const y = labelPos.y - rectHeight / 2
      const radius = 6
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + rectWidth - radius, y)
      ctx.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + radius)
      ctx.lineTo(x + rectWidth, y + rectHeight - radius)
      ctx.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - radius, y + rectHeight)
      ctx.lineTo(x + radius, y + rectHeight)
      ctx.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.fill()

      ctx.fillStyle = '#aaccff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(labelText, labelPos.x, labelPos.y)
    })
  }, [chartData, clickedStars])

  const generateShatterFragments = useCallback(() => {
    const fragments = []
    const cellW = CHART_CANVAS_WIDTH / gridSize
    const cellH = CHART_CANVAS_HEIGHT / gridSize

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const centerX = col * cellW + cellW / 2
        const centerY = row * cellH + cellH / 2
        const angle = Math.atan2(centerY - CHART_CANVAS_HEIGHT / 2, centerX - CHART_CANVAS_WIDTH / 2)
        const dist = Math.sqrt(
          Math.pow(centerX - CHART_CANVAS_WIDTH / 2, 2) +
          Math.pow(centerY - CHART_CANVAS_HEIGHT / 2, 2)
        )
        const speed = 2 + dist * 0.01

        fragments.push({
          x: col * cellW,
          y: row * cellH,
          w: cellW,
          h: cellH,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
          vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
          rot: 0,
          rotSpeed: (Math.random() - 0.5) * 0.1,
          row,
          col,
        })
      }
    }
    return fragments
  }, [gridSize])

  const drawShatter = useCallback((ctx: CanvasRenderingContext2D) => {
    if (shatterFragments.length === 0) return

    const cellW = CHART_CANVAS_WIDTH / gridSize
    const cellH = CHART_CANVAS_HEIGHT / gridSize

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CHART_CANVAS_WIDTH, CHART_CANVAS_HEIGHT)

    shatterFragments.forEach((frag) => {
      ctx.save()
      ctx.translate(frag.x + frag.w / 2, frag.y + frag.h / 2)
      ctx.rotate(frag.rot)
      ctx.globalAlpha = Math.max(0, 1 - shatterProgress * 0.5)

      const sx = frag.col * cellW
      const sy = frag.row * cellH

      ctx.drawImage(
        canvasRef.current!,
        sx, sy, cellW, cellH,
        -frag.w / 2, -frag.h / 2, frag.w, frag.h
      )

      ctx.restore()
    })
  }, [shatterFragments, shatterProgress, gridSize])

  const drawFragment = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const centerX = CHART_CANVAS_WIDTH / 2
    const centerY = CHART_CANVAS_HEIGHT / 2
    const size = 30

    const pulse = 0.8 + Math.sin(time * 0.005) * 0.2

    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 2.5)
    glowGradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * pulse})`)
    glowGradient.addColorStop(0.5, `rgba(255, 200, 50, ${0.3 * pulse})`)
    glowGradient.addColorStop(1, 'rgba(255, 180, 0, 0)')

    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, size * 2.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(time * 0.001)

    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 8
      const x = Math.cos(angle) * size
      const y = Math.sin(angle) * size
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()

    const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
    innerGradient.addColorStop(0, SEASON_COLORS[season])
    innerGradient.addColorStop(0.7, `${SEASON_COLORS[season]}88`)
    innerGradient.addColorStop(1, `${SEASON_COLORS[season]}44`)

    ctx.fillStyle = innerGradient
    ctx.fill()

    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255, 255, 200, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 8
      const x = Math.cos(angle) * (size - 4)
      const y = Math.sin(angle) * (size - 4)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }, [season])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isShattering || showFragment) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CHART_CANVAS_WIDTH / rect.width
    const scaleY = CHART_CANVAS_HEIGHT / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const hitStar = chartData.stars.find((star) => {
      const dist = Math.sqrt(Math.pow(star.x - x, 2) + Math.pow(star.y - y, 2))
      return dist < star.size + 8
    })

    if (hitStar && chartData.specialStarIds.includes(hitStar.id)) {
      if (!clickedStars.includes(hitStar.id)) {
        playPingSound()
        const newClicked = [...clickedStars, hitStar.id]
        setClickedStars(newClicked)

        if (particleSystemRef.current) {
          particleSystemRef.current.spawnUnlockParticles(hitStar.x, hitStar.y, '#ffd700', 15)
        }

        if (newClicked.length >= 3) {
          setTimeout(() => {
            setIsShattering(true)
            setShatterFragments(generateShatterFragments())
          }, 500)
        }
      }
    }
  }, [chartData, clickedStars, isShattering, showFragment, playPingSound, generateShatterFragments])

  useEffect(() => {
    if (isShattering && shatterFragments.length > 0) {
      const startTime = Date.now()
      const duration = 2000

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(1, elapsed / duration)
        setShatterProgress(progress)

        setShatterFragments((prev) =>
          prev.map((frag) => ({
            ...frag,
            x: frag.x + frag.vx,
            y: frag.y + frag.vy,
            vy: frag.vy + 0.1,
            rot: frag.rot + frag.rotSpeed,
          }))
        )

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setShowFragment(true)
          setTimeout(() => {
            collectFragment()
          }, 1000)
        }
      }

      animate()
    }
  }, [isShattering, shatterFragments.length, collectFragment])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CHART_CANVAS_WIDTH
    canvas.height = CHART_CANVAS_HEIGHT

    const particleCanvas = particleCanvasRef.current
    if (particleCanvas) {
      particleCanvas.width = CHART_CANVAS_WIDTH
      particleCanvas.height = CHART_CANVAS_HEIGHT
      
      if (!particleSystemRef.current) {
        particleSystemRef.current = new ParticleSystem()
      }
      particleSystemRef.current.setCanvas(particleCanvas)
      particleSystemRef.current.start()
    }

    let startTime = performance.now()
    let animId: number

    const render = (time: number) => {
      const elapsed = time - startTime

      if (showFragment) {
        ctx.clearRect(0, 0, CHART_CANVAS_WIDTH, CHART_CANVAS_HEIGHT)
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, CHART_CANVAS_WIDTH, CHART_CANVAS_HEIGHT)
        drawFragment(ctx, elapsed)
      } else if (isShattering) {
        drawShatter(ctx)
      } else {
        drawStars(ctx, elapsed)
      }

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      if (particleSystemRef.current) {
        particleSystemRef.current.stop()
      }
    }
  }, [drawStars, drawShatter, drawFragment, isShattering, showFragment])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'rgba(15, 20, 45, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(100, 150, 200, 0.3)',
          boxShadow: '0 0 40px rgba(50, 100, 200, 0.3)',
          animation: 'scaleIn 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              color: SEASON_COLORS[season],
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: `0 0 10px ${SEASON_COLORS[season]}40`,
            }}
          >
            {SEASON_NAMES[season]}星空
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8899bb',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff'
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8899bb'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{
              borderRadius: '8px',
              cursor: showFragment || isShattering ? 'default' : 'pointer',
              maxWidth: '700px',
              width: '100%',
              height: 'auto',
            }}
            onClick={handleCanvasClick}
          />
          <canvas
            ref={particleCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              borderRadius: '8px',
              maxWidth: '700px',
              width: '100%',
              height: 'auto',
            }}
          />
        </div>

        <div style={{ marginTop: '16px', color: '#8899bb', fontSize: '14px' }}>
          {showFragment ? (
            <span style={{ color: SEASON_COLORS[season] }}>
              ✦ 星盘碎片已收集！
            </span>
          ) : isShattering ? (
            <span>星图正在碎裂...</span>
          ) : (
            <span>
              找到三颗特殊的星星并点击它们 ({clickedStars.length}/3)
            </span>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

interface StarChartCardProps {
  season: string
  unlocked: boolean
  onClick: () => void
  unlockAngle?: string
}

function StarChartCard({ season, unlocked, onClick, unlockAngle }: StarChartCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={unlocked ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '120px',
        height: '160px',
        borderRadius: '10px',
        backgroundColor: unlocked ? 'rgba(20, 30, 60, 0.9)' : 'rgba(30, 30, 40, 0.9)',
        border: `1px solid ${unlocked ? SEASON_COLORS[season] + '60' : 'rgba(80, 80, 100, 0.5)'}`,
        cursor: unlocked ? 'pointer' : 'not-allowed',
        transition: 'all 0.3s ease',
        transform: isHovered && unlocked ? 'scale(1.1)' : 'scale(1)',
        boxShadow: isHovered && unlocked
          ? `0 0 20px ${SEASON_COLORS[season]}40`
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 8px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!unlocked && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(20, 20, 30, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
          <div style={{ fontSize: '11px', color: '#666677', textAlign: 'center', padding: '0 8px' }}>
            {unlockAngle}
          </div>
        </div>
      )}

      <div
        style={{
          color: unlocked ? SEASON_COLORS[season] : '#555566',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        {SEASON_NAMES[season]}
      </div>

      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: unlocked
            ? `radial-gradient(circle, ${SEASON_COLORS[season]}20 0%, transparent 70%)`
            : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          position: 'relative',
        }}
      >
        {unlocked && (
          <>
            <div
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                top: '20px',
                left: '25px',
                boxShadow: '0 0 4px #ffffff',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '3px',
                height: '3px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                top: '35px',
                left: '50px',
                boxShadow: '0 0 3px #ffffff',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '2px',
                height: '2px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                top: '50px',
                left: '30px',
                boxShadow: '0 0 2px #ffffff',
              }}
            />
          </>
        )}
      </div>

      <div style={{ fontSize: '24px' }}>
        {season === 'winter' && '❄️'}
        {season === 'spring' && '🌸'}
        {season === 'summer' && '☀️'}
        {season === 'autumn' && '🍂'}
      </div>
    </div>
  )
}

export default function StarChart() {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
  const unlockedCharts = useGameStore((state) => state.unlockedCharts)
  const collectedFragments = useGameStore((state) => state.collectedFragments)
  const totalFragments = useGameStore((state) => state.totalFragments)

  const seasons: Array<'winter' | 'spring' | 'summer' | 'autumn'> = [
    'winter',
    'spring',
    'summer',
    'autumn',
  ]

  const unlockHints: Record<string, string> = {
    winter: '指向子时解锁',
    spring: '指向卯时解锁',
    summer: '指向午时解锁',
    autumn: '指向酉时解锁',
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          gap: '12px',
          zIndex: 10,
        }}
      >
        {seasons.map((season) => (
          <StarChartCard
            key={season}
            season={season}
            unlocked={unlockedCharts[season]}
            onClick={() => setSelectedSeason(season)}
            unlockAngle={unlockHints[season]}
          />
        ))}
      </div>

      {selectedSeason && (
        <StarChartDisplay
          season={selectedSeason}
          onClose={() => setSelectedSeason(null)}
        />
      )}
    </>
  )
}
