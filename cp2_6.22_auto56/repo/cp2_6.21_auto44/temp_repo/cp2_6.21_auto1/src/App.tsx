import { useEffect, useRef, useState, useCallback } from 'react'
import {
  GameState,
  createInitialState,
  attemptMove,
  finishAnimation,
  getMovableCells,
  posEq,
  addAfterimage,
  updateAfterimages,
  INITIAL_STAMINA,
} from './game/GameEngine'
import {
  render as canvasRender,
  computeConfig,
  cellFromPixel,
  RendererConfig,
} from './renderer/CanvasRenderer'

const MOVE_DURATION_MS = 300
const AFTERIMAGE_INTERVAL = 60

interface StaminaProps {
  label: string
  emoji: string
  value: number
  max: number
  gradient: [string, string]
}

function CircularProgress({ label, emoji, value, max, gradient }: StaminaProps) {
  const size = 64
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, value / max))
  const offset = circumference * (1 - pct)
  const id = `grad-${label}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          {emoji}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {value}
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.5)',
              marginLeft: 4,
            }}
          >
            / {max}
          </span>
        </div>
      </div>
    </div>
  )
}

function ReloadIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: 'rgba(255,255,255,0.9)',
        transition: 'transform 0.5s ease-in-out',
        transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)',
      }}
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState())
  const [spinning, setSpinning] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef<GameState>(gameState)
  const cfgRef = useRef<RendererConfig | null>(null)
  const animStartRef = useRef<number | null>(null)
  const lastAfterimageRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(performance.now())
  const rafRef = useRef<number>(0)
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 })

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  const resetGame = useCallback(() => {
    setSpinning(true)
    setTimeout(() => setSpinning(false), 500)
    setGameState(createInitialState())
    animStartRef.current = null
    lastAfterimageRef.current = 0
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const w = Math.max(600, Math.floor(rect.width))
      const h = Math.max(500, Math.floor(rect.height))
      setCanvasSize({ w, h })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.w * dpr
    canvas.height = canvasSize.h * dpr
    canvas.style.width = canvasSize.w + 'px'
    canvas.style.height = canvasSize.h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    cfgRef.current = computeConfig(canvasSize.w, canvasSize.h)

    const loop = (now: number) => {
      const delta = now - lastFrameRef.current
      lastFrameRef.current = now
      let state = stateRef.current

      if (state.animatingCharacter !== null) {
        if (animStartRef.current === null) {
          animStartRef.current = now
        }
        const elapsed = now - animStartRef.current
        const progress = Math.min(1, elapsed / MOVE_DURATION_MS)

        if (now - lastAfterimageRef.current >= AFTERIMAGE_INTERVAL && progress < 0.95) {
          lastAfterimageRef.current = now
          if (state.fromPosition && state.animatingCharacter) {
            const t = progress
            const fp = state.fromPosition
            const tp = state.toPosition!
            const ix = fp.x + (tp.x - fp.x) * t
            const iy = fp.y + (tp.y - fp.y) * t
            state = addAfterimage(state, { x: ix, y: iy }, state.animatingCharacter, 250)
          }
        }

        state = updateAfterimages(state, delta)
        state = { ...state, animationProgress: progress }

        if (progress >= 1) {
          state = finishAnimation(state)
          animStartRef.current = null
        }
        stateRef.current = state
        setGameState(state)
      } else {
        if (state.afterimages.length > 0) {
          state = updateAfterimages(state, delta)
          stateRef.current = state
          setGameState(state)
        }
      }

      if (cfgRef.current) {
        canvasRender(ctx, state, cfgRef.current, now)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [canvasSize])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const state = stateRef.current
      const cfg = cfgRef.current
      if (!cfg || state.isGameOver || state.animatingCharacter) return
      const rect = canvasRef.current!.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const cell = cellFromPixel(px, py, cfg)
      if (!cell) return

      const current = state.currentTurn
      const movable = getMovableCells(state, current)
      const isMovable = movable.some((m) => posEq(m, cell))

      if (isMovable) {
        const t0 = performance.now()
        const { newState, valid } = attemptMove(state, current, cell)
        if (valid) {
          const elapsed = performance.now() - t0
          if (elapsed > 50) {
            console.warn(`Move detection slow: ${elapsed.toFixed(1)}ms`)
          }
          stateRef.current = newState
          setGameState(newState)
          animStartRef.current = null
          lastAfterimageRef.current = 0
        }
      } else {
        const newSel = state.selectedCell && posEq(state.selectedCell, cell) ? null : cell
        stateRef.current = { ...state, selectedCell: newSel }
        setGameState(stateRef.current)
      }
    },
    []
  )

  const turnLabel =
    gameState.currentTurn === 'cheetah' ? '🐆 猎豹回合' : '🦌 羚羊回合'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #0f3b0f 0%, #1b5e1b 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 20%, rgba(126,200,80,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.08) 0%, transparent 40%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          zIndex: 10,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 32 }}>🌴</div>
          <div>
            <div
              style={{
                color: '#fbbf24',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 1,
                textShadow: '0 2px 8px rgba(251,191,36,0.25)',
                fontFamily: "'ZCOOL KuaiLe', 'Poppins', sans-serif",
              }}
            >
              丛林追逐
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                letterSpacing: 2,
                marginTop: 2,
              }}
            >
              JUNGLE CHASE
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '6px 18px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 10,
                letterSpacing: 1.5,
              }}
            >
              回合
            </div>
            <div
              style={{
                color: '#fff',
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              {gameState.round}
            </div>
            <div
              style={{
                color: gameState.currentTurn === 'cheetah' ? '#fb923c' : '#34d399',
                fontSize: 12,
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {turnLabel}
            </div>
          </div>

          <CircularProgress
            label="猎豹"
            emoji="🐆"
            value={gameState.cheetahStamina}
            max={INITIAL_STAMINA}
            gradient={['#fb923c', '#ef4444']}
          />
          <CircularProgress
            label="羚羊"
            emoji="🦌"
            value={gameState.antelopeStamina}
            max={INITIAL_STAMINA}
            gradient={['#22c55e', '#06b6d4']}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '6px 18px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 10,
                letterSpacing: 1.5,
              }}
            >
              步数
            </div>
            <div
              style={{
                color: '#fff',
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              {gameState.steps}
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                marginTop: 2,
              }}
            >
              🍎 {gameState.fruits.length}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            position: 'relative',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow:
              '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 60px rgba(0,0,0,0.3)',
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              display: 'block',
              cursor: 'pointer',
            }}
          />
        </div>

        <button
          onClick={resetGame}
          title="重置当前局"
          style={{
            position: 'absolute',
            right: 28,
            bottom: 28,
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <ReloadIcon spinning={spinning} />
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 28,
          bottom: 28,
          padding: '12px 18px',
          borderRadius: 14,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)',
          fontSize: 11.5,
          color: 'rgba(255,255,255,0.75)',
          lineHeight: 1.7,
          maxWidth: 280,
        }}
      >
        <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
          🎮 操作说明
        </div>
        点击相邻<span style={{ color: '#fff' }}>高亮格子</span>移动角色
        <br />
        <span style={{ color: '#7ec850' }}>■</span> 草地 消耗+1　
        <span style={{ color: '#3a7d2c' }}>■</span> 灌木 +2
        <br />
        <span style={{ color: '#8b5a2b' }}>■</span> 泥潭 +3　
        <span style={{ color: '#3b82f6' }}>■</span> 河流 不可通行
      </div>

      {gameState.isGameOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            background: 'rgba(0,0,0,0.35)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 28,
              padding: '44px 56px',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              minWidth: 420,
              textAlign: 'center',
              animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 12 }}>
              {gameState.winner === 'cheetah' ? '🐆' : '🦌'}
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#fbbf24',
                marginBottom: 4,
                textShadow: '0 4px 20px rgba(251,191,36,0.4)',
                letterSpacing: 2,
                fontFamily: "'ZCOOL KuaiLe', sans-serif",
              }}
            >
              {gameState.winner === 'cheetah' ? '猎豹胜利！' : '羚羊胜利！'}
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#9ca3af',
                marginBottom: 28,
                letterSpacing: 1,
              }}
            >
              {gameState.winner === 'cheetah'
                ? gameState.antelopeStamina <= 0
                  ? '羚羊体力耗尽，被猎豹追上了！'
                  : '猎豹成功追上了羚羊！'
                : '猎豹体力耗尽，羚羊成功逃脱！'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 32,
              }}
            >
              <StatCard
                emoji="🐆"
                label="猎豹剩余体力"
                value={gameState.cheetahStamina}
                winner={gameState.winner === 'cheetah'}
              />
              <StatCard
                emoji="🦌"
                label="羚羊剩余体力"
                value={gameState.antelopeStamina}
                winner={gameState.winner === 'antelope'}
              />
              <StatCard
                emoji="👣"
                label="总步数"
                value={gameState.steps}
                center
              />
              <StatCard emoji="🔄" label="总回合" value={gameState.round} center />
            </div>

            <button
              onClick={resetGame}
              style={{
                width: '100%',
                padding: '16px 32px',
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
                color: '#fff',
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: 2,
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(34,197,94,0.35)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)'
                e.currentTarget.style.boxShadow =
                  '0 6px 20px rgba(34,197,94,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow =
                  '0 10px 30px rgba(34,197,94,0.35)'
              }}
            >
              🔄 再来一局
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

interface StatCardProps {
  emoji: string
  label: string
  value: number
  winner?: boolean
  center?: boolean
}

function StatCard({ emoji, label, value, winner, center }: StatCardProps) {
  const color = winner ? '#fbbf24' : '#9ca3af'
  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${winner ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.1)'}`,
        textAlign: center ? 'center' : 'left',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.55)',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          justifyContent: center ? 'center' : 'flex-start',
        }}
      >
        <span>{emoji}</span>
        <span>{label}</span>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          lineHeight: 1,
          textShadow: winner ? '0 2px 12px rgba(251,191,36,0.4)' : 'none',
        }}
      >
        {value}
      </div>
    </div>
  )
}
