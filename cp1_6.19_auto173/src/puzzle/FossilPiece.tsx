import React, { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FossilPieceData } from '../types'

interface FossilPieceProps {
  piece: FossilPieceData
  boardRef: React.RefObject<HTMLDivElement>
  onDragStart: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onRotate: (id: string) => void
  isHighlighted: boolean
}

const FossilPiece: React.FC<FossilPieceProps> = ({
  piece,
  boardRef,
  onDragStart,
  onDragEnd,
  onRotate,
  isHighlighted,
}) => {
  const pieceRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [pos, setPos] = useState({ x: piece.currentX, y: piece.currentY })
  const [animState, setAnimState] = useState<'none' | 'snap' | 'error' | 'golden'>('none')

  useEffect(() => {
    setPos({ x: piece.currentX, y: piece.currentY })
  }, [piece.currentX, piece.currentY])

  useEffect(() => {
    if (animState !== 'none') {
      const t = setTimeout(() => setAnimState('none'), 450)
      return () => clearTimeout(t)
    }
  }, [animState])

  const playSnapAnim = useCallback(() => setAnimState('snap'), [])
  const playErrorAnim = useCallback(() => setAnimState('error'), [])
  const playGoldenAnim = useCallback(() => setAnimState('golden'), [])

  useEffect(() => {
    if (piece.isPlaced && piece.isLocked) {
      playSnapAnim()
    }
  }, [piece.isPlaced, piece.isLocked, playSnapAnim])

  useEffect(() => {
    if (piece.isPlaced && !piece.isLocked) {
      playGoldenAnim()
    }
  }, [piece.rotation, playGoldenAnim, piece.isPlaced, piece.isLocked])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (piece.isLocked && piece.isPlaced) {
      return
    }
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    const boardRect = boardRef.current?.getBoundingClientRect()
    if (!boardRect) return

    const offsetX = e.clientX - boardRect.left - pos.x
    const offsetY = e.clientY - boardRect.top - pos.y
    setDragOffset({ x: offsetX, y: offsetY })
    setIsDragging(true)
    onDragStart(piece.id)
  }

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      const boardRect = boardRef.current?.getBoundingClientRect()
      if (!boardRect) return

      let newX = e.clientX - boardRect.left - dragOffset.x
      let newY = e.clientY - boardRect.top - dragOffset.y

      newX = Math.max(70, Math.min(boardRect.width - 70, newX))
      newY = Math.max(70, Math.min(boardRect.height - 70, newY))

      setPos({ x: newX, y: newY })
    },
    [isDragging, dragOffset, boardRef]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      setIsDragging(false)
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      onDragEnd(piece.id, pos.x, pos.y)
    },
    [isDragging, pos.x, pos.y, piece.id, onDragEnd]
  )

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (piece.isPlaced && !piece.isLocked) {
      e.preventDefault()
      onRotate(piece.id)
    }
  }

  const animClass =
    animState === 'snap'
      ? 'snap-animation'
      : animState === 'error'
      ? 'error-flash'
      : animState === 'golden'
      ? 'golden-flash'
      : ''

  return (
    <motion.div
      ref={pieceRef}
      className={`fossil-piece ${isDragging ? 'dragging' : ''} ${
        piece.isPlaced ? 'placed' : ''
      } ${animClass}`}
      style={{
        left: pos.x - 70,
        top: pos.y - 70,
        zIndex: isDragging ? 100 : piece.isPlaced ? 10 : 50,
        pointerEvents: piece.isLocked && piece.isPlaced ? 'none' : 'auto',
      }}
      animate={{
        rotate: piece.rotation,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      whileHover={piece.isPlaced && !piece.isLocked ? { scale: 1.02 } : {}}
    >
      <div className="piece-inner">
        <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`grad-${piece.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4A574" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#8B7355" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6B5344" stopOpacity="0.85" />
            </linearGradient>
            <filter id={`shadow-${piece.id}`}>
              <feDropShadow dx="1" dy="1" stdDeviation="0.8" floodColor="#3E2723" floodOpacity="0.4" />
            </filter>
          </defs>
          <path
            d={piece.patternPath}
            fill={`url(#grad-${piece.id})`}
            stroke="#5D4037"
            strokeWidth="1.2"
            strokeLinejoin="round"
            filter={`url(#shadow-${piece.id})`}
          />
          <path
            d={piece.patternPath}
            fill="none"
            stroke="#4A3C2A"
            strokeWidth="0.6"
            strokeLinejoin="round"
            strokeDasharray="2,3"
            opacity="0.5"
            transform="translate(2, 2) scale(0.96)"
            style={{ transformOrigin: 'center' }}
          />
        </svg>
        <span className="piece-label">{piece.label}</span>
      </div>
    </motion.div>
  )
}

export default FossilPiece
