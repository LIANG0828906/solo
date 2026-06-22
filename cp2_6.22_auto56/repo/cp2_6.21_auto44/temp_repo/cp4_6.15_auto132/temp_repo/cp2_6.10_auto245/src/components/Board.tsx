import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, StoneColor } from '../store/useGameStore'

const BOARD_SIZE = 19

interface Ripple {
  id: string
  x: number
  y: number
}

const Board: React.FC = () => {
  const { board, placeStone } = useGameStore()
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)

  const cellSize = useMemo(() => {
    const minDimension = Math.min(window.innerWidth * 0.5, window.innerHeight * 0.85)
    return Math.floor(minDimension / (BOARD_SIZE + 1))
  }, [])

  const padding = cellSize

  const boardPixelSize = cellSize * (BOARD_SIZE - 1) + padding * 2

  const handleClick = useCallback((x: number, y: number) => {
    if (board[y][x] !== null) return
    
    placeStone(x, y)
    
    const newRipple: Ripple = {
      id: `${x}-${y}-${Date.now()}`,
      x,
      y
    }
    setRipples(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 1500)
  }, [board, placeStone])

  const getPixelPosition = (index: number) => padding + index * cellSize

  const renderGridLines = useMemo(() => {
    const lines: React.ReactNode[] = []
    
    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = getPixelPosition(i)
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding}
          y1={pos}
          x2={boardPixelSize - padding}
          y2={pos}
          stroke="#5a5a5a"
          strokeWidth="1"
        />
      )
      lines.push(
        <line
          key={`v-${i}`}
          x1={pos}
          y1={padding}
          x2={pos}
          y2={boardPixelSize - padding}
          stroke="#5a5a5a"
          strokeWidth="1"
        />
      )
    }
    return lines
  }, [boardPixelSize, cellSize, padding])

  const starPoints = useMemo(() => {
    const points = [
      [3, 3], [9, 3], [15, 3],
      [3, 9], [9, 9], [15, 9],
      [3, 15], [9, 15], [15, 15]
    ]
    return points.map(([x, y], idx) => (
      <circle
        key={`star-${idx}`}
        cx={getPixelPosition(x)}
        cy={getPixelPosition(y)}
        r={cellSize * 0.08}
        fill="#5a5a5a"
      />
    ))
  }, [cellSize])

  const renderStones = useMemo(() => {
    const stones: React.ReactNode[] = []
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const cx = getPixelPosition(x)
          const cy = getPixelPosition(y)
          const isBlack = cell === 'black'
          stones.push(
            <motion.g
              key={`stone-${x}-${y}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                duration: 0.3
              }}
            >
              <defs>
                <radialGradient
                  id={`grad-${x}-${y}`}
                  cx="35%"
                  cy="35%"
                  r="60%"
                >
                  <stop offset="0%" stopColor={isBlack ? '#4a4a4a' : '#ffffff'} />
                  <stop offset="100%" stopColor={isBlack ? '#1a1a1a' : '#d8d3c8'} />
                </radialGradient>
              </defs>
              <circle
                cx={cx}
                cy={cy}
                r={cellSize * 0.45}
                fill={`url(#grad-${x}-${y})`}
                stroke={isBlack ? 'none' : '#8b8b8b'}
                strokeWidth={isBlack ? 0 : 1}
                style={{
                  filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.3))'
                }}
              />
              {!isBlack && (
                <circle
                  cx={cx - cellSize * 0.15}
                  cy={cy - cellSize * 0.15}
                  r={cellSize * 0.1}
                  fill="rgba(255,255,255,0.6)"
                />
              )}
              {isBlack && (
                <circle
                  cx={cx - cellSize * 0.15}
                  cy={cy - cellSize * 0.15}
                  r={cellSize * 0.08}
                  fill="rgba(255,255,255,0.2)"
                />
              )}
            </motion.g>
          )
        }
      })
    })
    return stones
  }, [board, cellSize])

  const renderClickAreas = useMemo(() => {
    const areas: React.ReactNode[] = []
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const cx = getPixelPosition(x)
        const cy = getPixelPosition(y)
        areas.push(
          <rect
            key={`area-${x}-${y}`}
            x={cx - cellSize / 2}
            y={cy - cellSize / 2}
            width={cellSize}
            height={cellSize}
            fill="transparent"
            style={{ cursor: board[y][x] ? 'default' : 'pointer' }}
            onClick={() => handleClick(x, y)}
            onMouseEnter={() => !board[y][x] && setHoverPos({ x, y })}
            onMouseLeave={() => setHoverPos(null)}
          />
        )
      }
    }
    return areas
  }, [board, cellSize, handleClick])

  const renderHoverIndicator = useMemo(() => {
    if (!hoverPos || board[hoverPos.y][hoverPos.x] !== null) return null
    
    const cx = getPixelPosition(hoverPos.x)
    const cy = getPixelPosition(hoverPos.y)
    const nextColor: StoneColor = useGameStore.getState().currentMoveNumber % 2 === 0 ? 'black' : 'white'
    
    return (
      <motion.circle
        cx={cx}
        cy={cy}
        r={cellSize * 0.4}
        fill={nextColor === 'black' ? 'rgba(44, 44, 44, 0.3)' : 'rgba(240, 235, 224, 0.5)'}
        stroke={nextColor === 'black' ? '#2c2c2c' : '#8b8b8b'}
        strokeWidth="1"
        strokeDasharray="3 3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      />
    )
  }, [hoverPos, board, cellSize])

  const renderRipples = useMemo(() => {
    return ripples.map(ripple => {
      const cx = getPixelPosition(ripple.x)
      const cy = getPixelPosition(ripple.y)
      return (
        <AnimatePresence key={ripple.id}>
          <motion.g>
            {[0, 1, 2].map(i => (
              <motion.circle
                key={`ripple-${ripple.id}-${i}`}
                cx={cx}
                cy={cy}
                initial={{ r: cellSize * 0.4, opacity: 0.5 }}
                animate={{ 
                  r: cellSize * (1.2 + i * 0.4),
                  opacity: 0
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.15,
                  ease: 'easeOut'
                }}
                fill="none"
                stroke="rgba(44, 44, 44, 0.4)"
                strokeWidth="1.5"
              />
            ))}
            {[0, 1, 2].map(i => (
              <motion.circle
                key={`splash-${ripple.id}-${i}`}
                cx={cx + (Math.random() - 0.5) * cellSize * 0.8}
                cy={cy + (Math.random() - 0.5) * cellSize * 0.8}
                initial={{ 
                  r: cellSize * 0.08,
                  opacity: 0.8,
                  scale: 0
                }}
                animate={{ 
                  r: cellSize * 0.02,
                  opacity: 0,
                  scale: 1,
                  y: -cellSize * (0.3 + Math.random() * 0.3)
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
                fill="rgba(44, 44, 44, 0.6)"
              />
            ))}
          </motion.g>
        </AnimatePresence>
      )
    })
  }, [ripples, cellSize])

  const coordinateLabels = useMemo(() => {
    const labels: React.ReactNode[] = []
    const letters = 'ABCDEFGHJKLMNOPQRST'
    
    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = getPixelPosition(i)
      labels.push(
        <text
          key={`col-${i}`}
          x={pos}
          y={padding * 0.6}
          textAnchor="middle"
          fontSize={Math.max(10, cellSize * 0.35)}
          fill="#5a5a5a"
          fontFamily="'Noto Serif SC', serif"
        >
          {letters[i]}
        </text>
      )
      labels.push(
        <text
          key={`row-${i}`}
          x={padding * 0.4}
          y={pos + cellSize * 0.12}
          textAnchor="middle"
          fontSize={Math.max(10, cellSize * 0.35)}
          fill="#5a5a5a"
          fontFamily="'Noto Serif SC', serif"
        >
          {BOARD_SIZE - i}
        </text>
      )
    }
    return labels
  }, [cellSize, padding])

  return (
    <div className="board-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f0e6 0%, #ebe4d4 100%)',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)'
    }}>
      <svg
        width={boardPixelSize}
        height={boardPixelSize}
        style={{
          display: 'block',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      >
        <defs>
          <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="#f5f0e6" />
            <circle cx="25" cy="25" r="0.5" fill="rgba(180,170,150,0.1)" />
            <circle cx="75" cy="75" r="0.5" fill="rgba(180,170,150,0.1)" />
            <circle cx="50" cy="10" r="0.3" fill="rgba(180,170,150,0.08)" />
          </pattern>
          <filter id="inkBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
          </filter>
        </defs>
        
        <rect
          x="0"
          y="0"
          width={boardPixelSize}
          height={boardPixelSize}
          fill="url(#paperTexture)"
          rx="4"
        />
        
        <g filter="url(#inkBlur)">
          {renderGridLines}
        </g>
        
        {starPoints}
        {coordinateLabels}
        {renderStones}
        {renderRipples}
        {renderHoverIndicator}
        {renderClickAreas}
      </svg>
    </div>
  )
}

export default Board
