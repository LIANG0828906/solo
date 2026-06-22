import React, { useRef, useCallback, useEffect } from 'react'
import type { IPuzzlePiece } from '../puzzle/PuzzleCore'
import { checkProximity } from '../puzzle/PuzzleCore'

interface PuzzleBoardProps {
  pieces: IPuzzlePiece[]
  onPieceMove: (pieceId: number, x: number, y: number) => void
  onPieceRotate: (pieceId: number, rotation: number) => void
  onPiecePlace: (pieceId: number) => void
  onTouch: () => void
  isCompleted: boolean
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  pieces,
  onPieceMove,
  onPieceRotate,
  onPiecePlace,
  onTouch,
  isCompleted,
}) => {
  const hoveredPieceRef = useRef<number | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<number | null>(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>()
  const pendingMoveRef = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, pieceId: number) => {
      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece || piece.isPlaced || isCompleted) return

      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const rect = boardRef.current?.getBoundingClientRect()
      if (!rect) return

      draggingRef.current = pieceId
      offsetRef.current = {
        x: e.clientX - rect.left - piece.currentX,
        y: e.clientY - rect.top - piece.currentY,
      }

      onTouch()
    },
    [pieces, isCompleted, onTouch]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingRef.current === null) return

      const rect = boardRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left - offsetRef.current.x
      const y = e.clientY - rect.top - offsetRef.current.y

      const clampedX = Math.max(40, Math.min(660, x))
      const clampedY = Math.max(40, Math.min(460, y))

      pendingMoveRef.current = { x: clampedX, y: clampedY }

      if (!rafRef.current) {
        const animate = () => {
          if (pendingMoveRef.current && draggingRef.current !== null) {
            onPieceMove(
              draggingRef.current,
              pendingMoveRef.current.x,
              pendingMoveRef.current.y
            )
            pendingMoveRef.current = null
          }
          rafRef.current = requestAnimationFrame(animate)
        }
        rafRef.current = requestAnimationFrame(animate)
      }
    },
    [onPieceMove]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (draggingRef.current === null) return

      const pieceId = draggingRef.current
      const piece = pieces.find((p) => p.id === pieceId)

      draggingRef.current = null
      pendingMoveRef.current = null

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = undefined
      }

      if (piece && checkProximity(piece)) {
        onPiecePlace(pieceId)
      }
    },
    [pieces, onPiecePlace]
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent, pieceId: number) => {
      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece || piece.isPlaced || isCompleted) return

      e.preventDefault()
      e.stopPropagation()

      const rotateAmount = e.deltaY > 0 ? 5 : -5
      const newRotation = piece.currentRotation + rotateAmount
      onPieceRotate(pieceId, newRotation)
    },
    [pieces, isCompleted, onPieceRotate]
  )

  const handleMouseEnter = useCallback((pieceId: number) => {
    hoveredPieceRef.current = pieceId
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoveredPieceRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={boardRef}
      style={{
        width: '700px',
        height: '500px',
        borderRadius: '16px',
        background: 'linear-gradient(145deg, #8B5A2B 0%, #6B4226 100%)',
        border: '2px solid #4A2F1A',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.3)',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              rgba(74, 47, 26, 0.15) 40px,
              rgba(74, 47, 26, 0.15) 42px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 60px,
              rgba(74, 47, 26, 0.08) 60px,
              rgba(74, 47, 26, 0.08) 62px
            )
          `,
          pointerEvents: 'none',
        }}
      />

      {pieces.map((piece) => (
        <div
          key={piece.id}
          onPointerDown={(e) => handlePointerDown(e, piece.id)}
          onWheel={(e) => handleWheel(e, piece.id)}
          onMouseEnter={() => handleMouseEnter(piece.id)}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '85px',
            height: '85px',
            transform: `translate(${piece.currentX - 42.5}px, ${piece.currentY - 42.5}px) rotate(${piece.currentRotation}deg)`,
            transition: piece.isPlaced ? 'transform 0.2s ease-out' : 'none',
            cursor: piece.isPlaced ? 'default' : 'grab',
            zIndex: piece.isPlaced ? 1 : 10 + piece.id,
          }}
        >
          <svg
            width="85"
            height="85"
            viewBox="0 0 85 85"
            style={{
              filter: piece.isPlaced
                ? 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))'
                : 'drop-shadow(3px 3px 6px rgba(0,0,0,0.5))',
            }}
          >
            <polygon
              points={piece.points}
              fill={piece.color}
              stroke="#D3D3D3"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <polygon
              points={piece.points}
              fill="url(#ceramicGlaze)"
              opacity="0.3"
            />
            <defs>
              <linearGradient
                id="ceramicGlaze"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="white" />
                <stop offset="50%" stopColor="transparent" />
                <stop offset="100%" stopColor="#5D3A1A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  )
}

export default PuzzleBoard
