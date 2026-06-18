import React, { memo } from 'react'
import type { PieceData, PlayerId } from './gameStore'
import { PLAYER_COLORS, PLAYER_HIGHLIGHTS } from './gameStore'

interface PieceProps {
  piece: PieceData
  cellSize: number
}

const PieceComponent: React.FC<PieceProps> = ({ piece, cellSize }) => {
  const now = performance.now()
  const elapsed = now - piece.placedAt
  const pulseDuration = 500
  const t = Math.min(1, elapsed / pulseDuration)
  const easeOut = 1 - Math.pow(1 - t, 3)
  const scale = 0.5 + 0.5 * easeOut
  const opacity = t

  const color = PLAYER_COLORS[piece.player as PlayerId]
  const highlight = PLAYER_HIGHLIGHTS[piece.player as PlayerId]
  const radius = 25

  const uniqueId = `grad-${piece.id}`
  const glowId = `glow-${piece.id}`

  return (
    <div
      style={{
        position: 'absolute',
        left: `${(piece.col + 0.5) * cellSize - radius}px`,
        top: `${(piece.row + 0.5) * cellSize - radius}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        borderRadius: '50%',
        transform: `scale(${scale})`,
        opacity,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
        transition: 'left 200ms cubic-bezier(0.4, 0, 0.2, 1), top 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        filter: `drop-shadow(0 0 12px ${color}99)`,
      }}
    >
      <svg
        width={radius * 2}
        height={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id={uniqueId} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor={highlight} stopOpacity="1" />
            <stop offset="35%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </radialGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill={`url(#${uniqueId})`}
          filter={`url(#${glowId})`}
        />
        <ellipse
          cx={radius * 0.75}
          cy={radius * 0.6}
          rx={radius * 0.3}
          ry={radius * 0.22}
          fill={highlight}
          opacity="0.7"
        />
      </svg>
    </div>
  )
}

export const Piece = memo(PieceComponent, (prev, next) => {
  return (
    prev.piece.id === next.piece.id &&
    prev.piece.player === next.piece.player &&
    prev.piece.row === next.piece.row &&
    prev.piece.col === next.piece.col &&
    prev.piece.placedAt === next.piece.placedAt &&
    prev.cellSize === next.cellSize
  )
})
