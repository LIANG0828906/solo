import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, Cell } from './gameStore'
import {
  GLOW_COLOR,
  BG_COLOR,
  PIPE_EMPTY_COLOR,
  ERROR_COLOR,
  WIN_COLOR,
  PipeType,
} from './pipeTypes'

interface PipeSVGProps {
  cell: Cell
  cellSize: number
}

function getPipePath(type: PipeType, cellSize: number): string {
  const center = cellSize / 2
  const strokeW = cellSize * 0.15
  const half = strokeW / 2

  switch (type) {
    case 'CROSS':
      return `
        M ${center - half} 0 L ${center + half} 0 L ${center + half} ${cellSize} L ${center - half} ${cellSize} Z
        M 0 ${center - half} L ${cellSize} ${center - half} L ${cellSize} ${center + half} L 0 ${center + half} Z
      `

    case 'STRAIGHT':
      return `
        M ${center - half} 0 L ${center + half} 0 L ${center + half} ${cellSize} L ${center - half} ${cellSize} Z
      `

    case 'ELBOW':
      return `
        M ${center - half} 0 L ${center + half} 0 L ${center + half} ${center - half} L ${cellSize} ${center - half}
        L ${cellSize} ${center + half} L ${center - half} ${center + half} Z
      `

    case 'TEE':
      return `
        M ${center - half} 0 L ${center + half} 0 L ${center + half} ${cellSize} L ${center - half} ${cellSize} Z
        M ${center - half} ${center - half} L ${cellSize} ${center - half} L ${cellSize} ${center + half} L ${center - half} ${center + half} Z
      `

    case 'START':
      return `
        M 0 ${center - half} L ${center + half} ${center - half} L ${center + half} ${center + half} L 0 ${center + half} Z
      `

    case 'END':
      return `
        M ${center - half} ${center - half} L ${cellSize} ${center - half} L ${cellSize} ${center + half} L ${center - half} ${center + half} Z
      `

    default:
      return ''
  }
}

const PipeSVG: React.FC<PipeSVGProps> = ({ cell, cellSize }) => {
  const strokeColor = cell.isFilled ? GLOW_COLOR : PIPE_EMPTY_COLOR
  const glowFilter = cell.isFilled ? `drop-shadow(0 0 8px ${GLOW_COLOR})` : 'none'

  let displayColor = strokeColor
  if (cell.isError) {
    displayColor = ERROR_COLOR
  } else if (cell.isFilled && useGameStore.getState().hasWon) {
    displayColor = WIN_COLOR
  }

  const path = getPipePath(cell.type, cellSize)

  return (
    <motion.svg
      width={cellSize}
      height={cellSize}
      style={{ filter: glowFilter }}
      animate={{
        rotate: cell.rotation,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <path
        d={path}
        fill={displayColor}
        stroke={displayColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {cell.type === 'START' && (
        <circle
          cx={cellSize * 0.25}
          cy={cellSize / 2}
          r={cellSize * 0.15}
          fill={GLOW_COLOR}
          style={{ filter: `drop-shadow(0 0 6px ${GLOW_COLOR})` }}
        />
      )}
      {cell.type === 'END' && (
        <rect
          x={cellSize * 0.6}
          y={cellSize * 0.25}
          width={cellSize * 0.3}
          height={cellSize * 0.5}
          rx={3}
          fill={GLOW_COLOR}
          style={{ filter: `drop-shadow(0 0 6px ${GLOW_COLOR})` }}
        />
      )}
    </motion.svg>
  )
}

interface CellProps {
  cell: Cell
  row: number
  col: number
  cellSize: number
  onClick: () => void
}

const GameCell: React.FC<CellProps> = ({ cell, cellSize, onClick }) => {
  const hasWon = useGameStore((state) => state.hasWon)
  const showWinAnimation = useGameStore((state) => state.showWinAnimation)

  const isClickable =
    cell.type !== 'START' &&
    cell.type !== 'END' &&
    !useGameStore.getState().isFlowing &&
    !useGameStore.getState().hasWon

  return (
    <motion.div
      className="game-cell"
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
      }}
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <PipeSVG cell={cell} cellSize={cellSize - 4} />
      <AnimatePresence>
        {cell.isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, repeat: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 68, 68, 0.5)',
              borderRadius: 6,
              boxShadow: `0 0 20px ${ERROR_COLOR}`,
            }}
          />
        )}
        {hasWon && showWinAnimation && cell.isFilled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(136, 221, 255, 0.3)',
              borderRadius: 6,
              boxShadow: `0 0 15px ${WIN_COLOR}`,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface GameBoardProps {
  onCellClick: (row: number, col: number) => void
}

const GameBoard: React.FC<GameBoardProps> = ({ onCellClick }) => {
  const grid = useGameStore((state) => state.grid)
  const showError = useGameStore((state) => state.showError)
  const showWinAnimation = useGameStore((state) => state.showWinAnimation)

  const [cellSize, setCellSize] = React.useState(56)

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 600) {
        setCellSize(36)
      } else {
        setCellSize(56)
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const gridGap = 2
  const gridWidth = 8 * cellSize + 7 * gridGap

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [1, 1.02, 1.02, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, times: [0, 0.1, 0.9, 1] }}
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              backgroundColor: 'rgba(255,0,0,0.15)',
              borderRadius: 10,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(8, ${cellSize}px)`,
          gap: gridGap,
          padding: 12,
          backgroundColor: BG_COLOR,
          borderRadius: 10,
          boxShadow: showWinAnimation
            ? `0 0 40px ${GLOW_COLOR}`
            : `0 0 20px rgba(0, 0, 0, 0.5)`,
          width: gridWidth + 24,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GameCell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              row={rowIndex}
              col={colIndex}
              cellSize={cellSize}
              onClick={() => onCellClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default GameBoard
