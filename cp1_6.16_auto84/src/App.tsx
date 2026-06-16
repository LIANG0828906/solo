import { useEffect, useState, useRef } from 'react'
import SundialScene from './sundial/SundialScene'
import StarChart from './stars/StarChart'
import { useGameStore } from './store/store'
import { SEASON_COLORS } from './sundial/SundialUtils'

function ProgressBar() {
  const collected = useGameStore((state) => state.collectedFragments)
  const total = useGameStore((state) => state.totalFragments)

  const segments = 8
  const arcRadius = 28
  const arcGap = 4

  const getArcPath = (index: number, filled: boolean) => {
    const startAngle = -Math.PI / 2 + (index / segments) * Math.PI * 2 + arcGap * 0.01
    const endAngle = -Math.PI / 2 + ((index + 1) / segments) * Math.PI * 2 - arcGap * 0.01

    const x1 = 50 + Math.cos(startAngle) * arcRadius
    const y1 = 50 + Math.sin(startAngle) * arcRadius
    const x2 = 50 + Math.cos(endAngle) * arcRadius
    const y2 = 50 + Math.sin(endAngle) * arcRadius

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

    return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 20,
      }}
    >
      <div
        style={{
          color: '#aabbdd',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        星盘碎片
      </div>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {Array.from({ length: segments }).map((_, i) => {
          const filled = i < collected
          return (
            <path
              key={i}
              d={getArcPath(i, filled)}
              fill="none"
              stroke={filled ? '#ffd700' : '#3a3a5a'}
              strokeWidth="6"
              strokeLinecap="round"
              style={{
                transition: 'stroke 0.5s ease',
                filter: filled ? 'drop-shadow(0 0 4px #ffd700)' : 'none',
              }}
            />
          )
        })}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={collected >= total ? '#ffd700' : '#8899bb'}
          fontSize="18"
          fontWeight="bold"
          style={{
            filter: collected >= total ? 'drop-shadow(0 0 4px #ffd700)' : 'none',
          }}
        >
          {collected}/{total}
        </text>
      </svg>
    </div>
  )
}

function AchievementScreen() {
  const time = useGameStore((state) => state.achievementTime)
  const resetGame = useGameStore((state) => state.resetGame)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 200)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 800
    const height = 600
    canvas.width = width
    canvas.height = height

    const stars: Array<{ x: number; y: number; size: number; twinkle: number }> = []
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.5 + Math.random() * 2,
        twinkle: Math.random() * Math.PI * 2,
      })
    }

    let animId: number
    const startTime = performance.now()

    const render = (time: number) => {
      const elapsed = time - startTime
      
      ctx.fillStyle = '#050515'
      ctx.fillRect(0, 0, width, height)

      stars.forEach((star) => {
        const brightness = 0.5 + Math.sin(elapsed * 0.002 + star.twinkle) * 0.5
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      const constellations = [
        { name: '猎户座', x: 150, y: 150, stars: [[-30, -20], [0, 0], [30, 20], [20, -10]] },
        { name: '大熊座', x: 600, y: 200, stars: [[-40, 0], [-20, -10], [0, -5], [20, 0], [35, 15], [25, 30], [5, 25]] },
        { name: '仙后座', x: 400, y: 100, stars: [[-25, 10], [-10, -15], [0, 0], [10, -15], [25, 10]] },
      ]

      constellations.forEach((cons) => {
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        cons.stars.forEach((s, i) => {
          const sx = cons.x + s[0]
          const sy = cons.y + s[1]
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        })
        ctx.stroke()
        ctx.setLineDash([])

        cons.stars.forEach((s) => {
          const sx = cons.x + s[0]
          const sy = cons.y + s[1]
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(sx, sy, 2, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => cancelAnimationFrame(animId)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}分${secs}秒`
  }

  const handleRestart = () => {
    resetGame()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#050515',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 2s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          zIndex: 1,
          animation: 'floatUp 2s ease-out',
        }}
      >
        <h1
          style={{
            fontSize: '72px',
            color: '#ffd700',
            fontWeight: 'bold',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3)',
            marginBottom: '30px',
            letterSpacing: '10px',
          }}
        >
          星轨归位
        </h1>
        <div
          style={{
            color: '#aabbdd',
            fontSize: '20px',
            marginBottom: '10px',
          }}
        >
          解锁用时：{formatTime(time)}
        </div>
        <div
          style={{
            color: SEASON_COLORS.autumn,
            fontSize: '18px',
            marginBottom: '40px',
          }}
        >
          收集率：100%
        </div>
        <button
          onClick={handleRestart}
          style={{
            padding: '14px 40px',
            fontSize: '18px',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            color: '#ffd700',
            border: '1px solid #ffd700',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.2)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          重新开始
        </button>
      </div>
      <style>{`
        @keyframes floatUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const gamePhase = useGameStore((state) => state.gamePhase)

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: Math.max(window.innerWidth, 1200),
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: '1200px',
        minHeight: '700px',
        position: 'relative',
        overflow: 'auto',
      }}
    >
      <SundialScene width={dimensions.width} height={dimensions.height} />
      <StarChart />
      <ProgressBar />

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 20,
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            color: '#ffd700',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            letterSpacing: '4px',
          }}
        >
          星轨仪象
        </h1>
        <p style={{ color: '#6677aa', fontSize: '13px', marginTop: '4px' }}>
          拖拽日晷指针，解锁四季星图
        </p>
      </div>

      {gamePhase === 'achievement' && <AchievementScreen />}
    </div>
  )
}
