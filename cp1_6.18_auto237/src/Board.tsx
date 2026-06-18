import React, { useEffect, useRef, useState, useMemo, memo } from 'react'
import { useGameStore, BOARD_SIZE, PLAYER_COLORS, getPlayerColor } from './gameStore'
import type { GravityLine, PlayerId, PieceData } from './gameStore'
import { Piece } from './Piece'

interface BoardProps {
  cellSize: number
}

const CELL_GRADIENT_START = '#0B0C10'
const CELL_GRADIENT_END = '#1F2833'
const STAR_LINE_COLOR = 'rgba(255, 255, 255, 0.15)'
const HOVER_GLOW = '#FFD700'

interface BoardCellProps {
  row: number
  col: number
  cellSize: number
  hovered: boolean
  onHover: (row: number, col: number, hovered: boolean) => void
  onClick: (row: number, col: number) => void
}

const BoardCell = memo(function BoardCell({
  row,
  col,
  cellSize,
  hovered,
  onHover,
  onClick,
}: BoardCellProps) {
  return (
    <div
      onMouseEnter={() => onHover(row, col, true)}
      onMouseLeave={() => onHover(row, col, false)}
      onClick={() => onClick(row, col)}
      style={{
        position: 'absolute',
        left: col * cellSize,
        top: row * cellSize,
        width: cellSize,
        height: cellSize,
        background: `linear-gradient(135deg, ${CELL_GRADIENT_START}, ${CELL_GRADIENT_END})`,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <svg
        width={cellSize}
        height={cellSize}
        viewBox={`0 0 ${cellSize} ${cellSize}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        <line x1="0" y1="0" x2={cellSize} y2="0" stroke={STAR_LINE_COLOR} strokeWidth="1" />
        <line x1="0" y1="0" x2="0" y2={cellSize} stroke={STAR_LINE_COLOR} strokeWidth="1" />
        {col === BOARD_SIZE - 1 && (
          <line
            x1={cellSize}
            y1="0"
            x2={cellSize}
            y2={cellSize}
            stroke={STAR_LINE_COLOR}
            strokeWidth="1"
          />
        )}
        {row === BOARD_SIZE - 1 && (
          <line
            x1="0"
            y1={cellSize}
            x2={cellSize}
            y2={cellSize}
            stroke={STAR_LINE_COLOR}
            strokeWidth="1"
          />
        )}
        {hovered && (
          <rect
            x="2"
            y="2"
            width={cellSize - 4}
            height={cellSize - 4}
            rx="6"
            fill="none"
            stroke={HOVER_GLOW}
            strokeWidth="2"
            opacity="0.4"
            style={{
              filter: `drop-shadow(0 0 8px ${HOVER_GLOW}aa)`,
            }}
          />
        )}
      </svg>
    </div>
  )
})

function GravityLineView({
  line,
  cellSize,
  now,
}: {
  line: GravityLine
  cellSize: number
  now: number
}) {
  const age = now - line.createdAt
  const ttl = 900
  const t = Math.min(1, age / ttl)
  const pulse = 0.5 + 0.5 * Math.sin(age * 0.015)
  const opacity = (1 - t) * (0.5 + 0.5 * pulse)

  const x1 = (line.from.col + 0.5) * cellSize
  const y1 = (line.from.row + 0.5) * cellSize
  const x2 = (line.to.col + 0.5) * cellSize
  const y2 = (line.to.row + 0.5) * cellSize

  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const nx = dx / len
  const ny = dy / len
  const offset = 25
  const sx = x1 + nx * offset
  const sy = y1 + ny * offset
  const ex = x2 - nx * offset
  const ey = y2 - ny * offset

  return (
    <line
      x1={sx}
      y1={sy}
      x2={ex}
      y2={ey}
      stroke={line.color}
      strokeWidth="2"
      strokeLinecap="round"
      opacity={opacity}
      style={{
        filter: `drop-shadow(0 0 4px ${line.color})`,
      }}
    />
  )
}

export const Board: React.FC<BoardProps> = ({ cellSize }) => {
  const boardSize = cellSize * BOARD_SIZE

  const board = useGameStore(s => s.board)
  const placePiece = useGameStore(s => s.placePiece)
  const gravityLines = useGameStore(s => s.gravityLines)
  const particles = useGameStore(s => s.particles)
  const shatterPieces = useGameStore(s => s.shatterPieces)
  const winner = useGameStore(s => s.winner)
  const victoryShownAt = useGameStore(s => s.victoryShownAt)
  const clearExpiredEffects = useGameStore(s => s.clearExpiredEffects)

  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [, forceRender] = useState(0)
  const hoverKeyRef = useRef<string | null>(null)

  hoverKeyRef.current = hoverKey

  const handleHover = (row: number, col: number, hovered: boolean) => {
    const key = `${row}-${col}`
    setHoverKey(hovered ? key : null)
  }

  const handleClick = (row: number, col: number) => {
    placePiece(row, col)
  }

  const cells = useMemo(() => {
    const result: { row: number; col: number }[] = []
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        result.push({ row: r, col: c })
      }
    }
    return result
  }, [])

  const pieceList = useMemo(() => {
    const list: typeof board[0][0][] = []
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const p = board[r][c]
        if (p) list.push(p)
      }
    }
    return list
  }, [board])

  useEffect(() => {
    const loop = () => {
      const now = performance.now()

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          const dpr = window.devicePixelRatio || 1
          const scale = dpr
          ctx.setTransform(scale, 0, 0, scale, 0, 0)

          for (const p of particles) {
            const age = now - p.createdAt
            const t = Math.min(1, age / p.duration)
            const alpha = 1 - t
            const posX = (p.x + 0.5) * cellSize + (p.vx * t * cellSize) / 100
            const posY = (p.y + 0.5) * cellSize + (p.vy * t * cellSize) / 100

            ctx.save()
            ctx.globalAlpha = alpha
            ctx.fillStyle = p.color
            ctx.shadowColor = p.color
            ctx.shadowBlur = 8
            ctx.beginPath()
            ctx.arc(posX, posY, p.size * (1 - t * 0.5), 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }

          for (const s of shatterPieces) {
            const age = now - s.createdAt
            const duration = 600
            const t = Math.min(1, age / duration)
            const alpha = 1 - t
            const ease = 1 - Math.pow(1 - t, 2)
            const posX = (s.x + 0.5) * cellSize + (s.vx * ease * cellSize) / 100
            const posY = (s.y + 0.5) * cellSize + (s.vy * ease * cellSize) / 100 + ease * ease * 30
            const rotation = s.rotation + s.vr * ease
            const sz = cellSize * s.size

            const color = getPlayerColor(s.player)
            ctx.save()
            ctx.translate(posX, posY)
            ctx.rotate(rotation)
            ctx.globalAlpha = alpha
            ctx.fillStyle = color
            ctx.shadowColor = color
            ctx.shadowBlur = 10
            ctx.beginPath()
            ctx.moveTo(-sz * 0.5, -sz * 0.4)
            ctx.lineTo(sz * 0.5, -sz * 0.1)
            ctx.lineTo(sz * 0.2, sz * 0.5)
            ctx.lineTo(-sz * 0.3, sz * 0.4)
            ctx.closePath()
            ctx.fill()
            ctx.restore()
          }

          if (winner !== null && victoryShownAt !== null) {
            const age = now - victoryShownAt
            const appear = 500
            const hold = 2000
            const fadeStart = appear + hold
            const total = fadeStart + 500

            if (age < total) {
              let scale = 1
              let alpha = 1

              if (age < appear) {
                const t = age / appear
                const ease = 1 - Math.pow(1 - t, 3)
                scale = 0.5 + 0.7 * ease
                alpha = t
              } else if (age < fadeStart) {
                scale = 1.2
                alpha = 1
              } else {
                const t = (age - fadeStart) / 500
                alpha = 1 - t
                scale = 1.2
              }

              const cx = boardSize / 2
              const cy = boardSize / 2
              const text = winner === 'draw' ? '平局' : `玩家 ${winner} 胜利！`
              const color = winner === 'draw' ? '#FFFFFF' : PLAYER_COLORS[winner as PlayerId]

              ctx.save()
              ctx.globalAlpha = alpha
              ctx.translate(cx, cy)
              ctx.scale(scale, scale)
              ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'

              ctx.shadowColor = color
              ctx.shadowBlur = 30
              ctx.strokeStyle = 'rgba(0,0,0,0.8)'
              ctx.lineWidth = 6
              ctx.strokeText(text, 0, 0)

              ctx.fillStyle = color
              ctx.fillText(text, 0, 0)

              ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif'
              ctx.shadowBlur = 15
              ctx.strokeStyle = 'rgba(0,0,0,0.6)'
              ctx.lineWidth = 4
              ctx.strokeText('STAR ORBIT CHESS', 0, 56)
              ctx.fillStyle = '#FFD700'
              ctx.fillText('STAR ORBIT CHESS', 0, 56)
              ctx.restore()
            }
          }
        }
      }

      clearExpiredEffects(now)

      let needsRender = false
      for (const p of pieceList) {
        if (now - p.placedAt < 600) {
          needsRender = true
          break
        }
      }
      if (!needsRender) {
        for (const l of gravityLines) {
          if (now - l.createdAt < 900) {
            needsRender = true
            break
          }
        }
      }
      if (!needsRender && particles.length > 0) needsRender = true
      if (!needsRender && shatterPieces.length > 0) needsRender = true
      if (!needsRender && hoverKeyRef.current !== null) needsRender = true

      if (needsRender) {
        forceRender(n => (n + 1) % 1000000)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [
    pieceList,
    gravityLines,
    particles,
    shatterPieces,
    cellSize,
    boardSize,
    winner,
    victoryShownAt,
    clearExpiredEffects,
  ])

  const now = performance.now()

  const canvasPxSize = cellSize * BOARD_SIZE
  const dpr = window.devicePixelRatio || 1

  return (
    <div
      style={{
        position: 'relative',
        width: boardSize,
        height: boardSize,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(79, 195, 247, 0.15), 0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {cells.map(({ row, col }) => (
        <BoardCell
          key={`${row}-${col}`}
          row={row}
          col={col}
          cellSize={cellSize}
          hovered={hoverKey === `${row}-${col}`}
          onHover={handleHover}
          onClick={handleClick}
        />
      ))}

      <svg
        width={boardSize}
        height={boardSize}
        viewBox={`0 0 ${boardSize} ${boardSize}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        {gravityLines.map((line, i) => (
          <GravityLineView key={`${line.from.row}-${line.from.col}-${line.to.row}-${line.to.col}-${i}`} line={line} cellSize={cellSize} now={now} />
        ))}
      </svg>

      {pieceList.map(p => (
        <Piece key={p.id} piece={p} cellSize={cellSize} />
      ))}

      <canvas
        ref={canvasRef}
        width={canvasPxSize * dpr}
        height={canvasPxSize * dpr}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: canvasPxSize,
          height: canvasPxSize,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
