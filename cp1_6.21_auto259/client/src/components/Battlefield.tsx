import React, { useEffect, useRef, useState } from 'react'
import type { CellState, GameState, Position, SkillEffectEvent, SkillType } from '../types/game'
import { CELL_SIZE, GRID_SIZE } from '../types/game'

interface BattlefieldProps {
  gameState: GameState | null
  myPlayerId: 1 | 2 | null
  onCellClick: (cell: Position) => void
  highlightCells: Position[] | null
  skillEffects: SkillEffectEvent[]
  onFlashScreen: () => void
  winner: null | 1 | 2
  showWinnerAnim: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

const cellBgColor = (state: CellState) => {
  switch (state) {
    case 'fire':
      return 'rgba(249,115,22,0.55)'
    case 'ice':
      return 'rgba(96,165,250,0.55)'
    case 'lightning':
      return 'rgba(248,250,252,0.7)'
    default:
      return 'rgba(30,41,59,0.7)'
  }
}

const cellBorder = (state: CellState) => {
  switch (state) {
    case 'fire':
      return '1px solid #F97316'
    case 'ice':
      return '1px solid #60A5FA'
    case 'lightning':
      return '1px solid #F8FAFC'
    default:
      return '1px solid #334155'
  }
}

export const Battlefield: React.FC<BattlefieldProps> = ({
  gameState,
  myPlayerId,
  onCellClick,
  highlightCells,
  skillEffects,
  onFlashScreen,
  winner,
  showWinnerAnim,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const effectsRef = useRef<
    { type: SkillType; cx: number; cy: number; startTime: number; duration: number; triggered: boolean }[]
  >([])
  const animRef = useRef<number>(0)
  const processedEffects = useRef<Set<number>>(new Set())
  const [hoverCell, setHoverCell] = useState<Position | null>(null)

  const gridW = GRID_SIZE * CELL_SIZE
  const gridH = GRID_SIZE * CELL_SIZE
  const players = gameState?.players

  useEffect(() => {
    for (const eff of skillEffects) {
      if (processedEffects.current.has(eff.timestamp)) continue
      processedEffects.current.add(eff.timestamp)
      const cx = eff.targetCell.col * CELL_SIZE + CELL_SIZE / 2
      const cy = eff.targetCell.row * CELL_SIZE + CELL_SIZE / 2
      const duration =
        eff.skillType === 'fireball' ? 400 : eff.skillType === 'iceshield' ? 600 : 300
      effectsRef.current.push({
        type: eff.skillType,
        cx,
        cy,
        startTime: performance.now(),
        duration,
        triggered: false,
      })

      if (eff.skillType === 'fireball') {
        const count = 22
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
          const speed = 40 + Math.random() * 50
          particlesRef.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 400,
            maxLife: 400,
            color: Math.random() > 0.5 ? '#F97316' : '#FBBF24',
            size: 3 + Math.random() * 4,
          })
        }
      } else if (eff.skillType === 'lightning') {
        onFlashScreen()
      }
    }
  }, [skillEffects, onFlashScreen])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let lastT = performance.now()

    const draw = (now: number) => {
      const dt = Math.min(50, now - lastT)
      lastT = now
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const alive: Particle[] = []
      for (const p of particlesRef.current) {
        p.x += (p.vx * dt) / 1000
        p.y += (p.vy * dt) / 1000
        p.vy += 40 * (dt / 1000)
        p.life -= dt
        if (p.life > 0) {
          const alpha = p.life / p.maxLife
          ctx.globalAlpha = alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
          ctx.fill()
          alive.push(p)
        }
      }
      particlesRef.current = alive
      ctx.globalAlpha = 1

      const remainingEffects: typeof effectsRef.current = []
      for (const eff of effectsRef.current) {
        const progress = Math.min(1, (now - eff.startTime) / eff.duration)
        if (progress >= 1) continue
        if (eff.type === 'fireball') {
          ctx.globalAlpha = 1 - progress
          const r = 10 + progress * 30
          const gradient = ctx.createRadialGradient(eff.cx, eff.cy, 0, eff.cx, eff.cy, r)
          gradient.addColorStop(0, 'rgba(254,240,138,1)')
          gradient.addColorStop(0.4, 'rgba(249,115,22,0.8)')
          gradient.addColorStop(1, 'rgba(239,68,68,0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(eff.cx, eff.cy, r, 0, Math.PI * 2)
          ctx.fill()
        } else if (eff.type === 'iceshield') {
          ctx.globalAlpha = 1 - progress
          const r = 8 + progress * 32
          ctx.strokeStyle = '#93C5FD'
          ctx.lineWidth = 3
          const sides = 6
          ctx.beginPath()
          for (let i = 0; i <= sides; i++) {
            const ang = (Math.PI * 2 * i) / sides - Math.PI / 2
            const x = eff.cx + Math.cos(ang) * r
            const y = eff.cy + Math.sin(ang) * r
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
          const fillGrad = ctx.createRadialGradient(eff.cx, eff.cy, 0, eff.cx, eff.cy, r)
          fillGrad.addColorStop(0, 'rgba(147,197,253,0.4)')
          fillGrad.addColorStop(1, 'rgba(59,130,246,0)')
          ctx.fillStyle = fillGrad
          ctx.fill()
        } else if (eff.type === 'lightning') {
          ctx.globalAlpha = 1 - progress
          const startX = eff.cx + (Math.random() - 0.5) * 4
          const startY = 0
          const endX = eff.cx
          const endY = eff.cy + 10
          ctx.strokeStyle = progress < 0.5 ? '#FFFFFF' : '#BFDBFE'
          ctx.lineWidth = 4
          ctx.shadowColor = '#60A5FA'
          ctx.shadowBlur = 16
          ctx.beginPath()
          let cx = startX
          let cy = startY
          ctx.moveTo(cx, cy)
          const segs = 8
          for (let i = 1; i <= segs; i++) {
            const t = i / segs
            const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 16 * (1 - t + 0.2)
            const y = startY + (endY - startY) * t
            ctx.lineTo(x, y)
            cx = x
            cy = y
          }
          ctx.stroke()
          ctx.shadowBlur = 0
          ctx.lineWidth = 1
          ctx.strokeStyle = '#F8FAFC'
          ctx.beginPath()
          cx = startX
          cy = startY
          ctx.moveTo(cx, cy)
          for (let i = 1; i <= segs; i++) {
            const t = i / segs
            const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 12 * (1 - t + 0.2)
            const y = startY + (endY - startY) * t
            ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        remainingEffects.push(eff)
      }
      effectsRef.current = remainingEffects
      ctx.globalAlpha = 1

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const isHighlighted = (r: number, c: number) =>
    highlightCells?.some((p) => p.row === r && p.col === c) ?? false

  const playerAt = (r: number, c: number) =>
    players?.find((p) => p && p.position.row === r && p.position.col === c) ?? null

  return (
    <div
      className="relative"
      style={{
        padding: 14,
        borderRadius: 24,
        background: '#0B1120',
        boxShadow: '0 0 40px rgba(59,130,246,0.4), 0 0 80px rgba(59,130,246,0.2), inset 0 0 30px rgba(59,130,246,0.08)',
        border: '2px solid #3B82F6',
      }}
    >
      <div
        className="relative"
        style={{
          width: gridW,
          height: gridH,
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: 0,
        }}
      >
        {Array.from({ length: GRID_SIZE }).map((_, r) =>
          Array.from({ length: GRID_SIZE }).map((_, c) => {
            const state = gameState?.gridState?.[r]?.[c] ?? null
            const hl = isHighlighted(r, c)
            const player = playerAt(r, c)
            const isHover = hoverCell?.row === r && hoverCell?.col === c
            const isWinner = winner !== null && player && player.id === winner && showWinnerAnim
            const isLoser = winner !== null && player && player.id !== winner && showWinnerAnim

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => onCellClick({ row: r, col: c })}
                onMouseEnter={() => setHoverCell({ row: r, col: c })}
                onMouseLeave={() => setHoverCell(null)}
                className="relative flex items-center justify-center cursor-pointer select-none"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: cellBgColor(state),
                  border: cellBorder(state),
                  boxShadow: hl
                    ? 'inset 0 0 20px rgba(250,204,21,0.6), 0 0 12px rgba(250,204,21,0.5)'
                    : isHover && myPlayerId === gameState?.currentTurn
                    ? 'inset 0 0 16px rgba(147,197,253,0.4)'
                    : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {player && (
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background:
                        player.id === 1
                          ? 'radial-gradient(circle at 30% 30%, #FCA5A5,#DC2626,#7F1D1D)'
                          : 'radial-gradient(circle at 30% 30%, #93C5FD,#2563EB,#1E3A8A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      boxShadow: `0 0 16px ${player.id === 1 ? '#EF4444' : '#3B82F6'}`,
                      border: `2px solid ${player.id === 1 ? '#FCA5A5' : '#93C5FD'}`,
                      animation: isWinner
                        ? 'winnerBlink 0.5s ease-in-out infinite'
                        : isLoser
                        ? 'loserFade 0.8s ease forwards'
                        : 'none',
                      transform: isWinner ? 'scale(1.4)' : 'scale(1)',
                      transition: isWinner ? 'transform 0.4s ease' : 'transform 0.25s ease',
                      opacity: isLoser ? 0 : 1,
                      zIndex: player.id === 1 ? 2 : 1,
                    }}
                  >
                    {player.id === 1 ? '🧙‍♂️' : '🧙'}
                    {player.hasIceShield && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          border: '2px solid #60A5FA',
                          animation: 'spin 2s linear infinite',
                          boxShadow: '0 0 10px #60A5FA',
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
        <canvas
          ref={canvasRef}
          width={gridW}
          height={gridH}
          className="absolute inset-0 pointer-events-none"
          style={{ imageRendering: 'auto' }}
        />
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes winnerBlink {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.8) drop-shadow(0 0 20px gold); }
        }
        @keyframes loserFade {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.5); }
        }
      `}</style>
    </div>
  )
}
