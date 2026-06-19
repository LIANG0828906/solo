import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import GameBoard from './gameBoard'
import { useGameStore } from './gameStore'
import { GLOW_COLOR } from './pipeTypes'
import './index.css'

const App: React.FC = () => {
  const { initLevel, rotatePipe, resetLevel, level, moves, hasWon } = useGameStore()

  useEffect(() => {
    initLevel()
  }, [initLevel])

  const handleCellClick = (row: number, col: number) => {
    rotatePipe(row, col)
  }

  const handleReset = () => {
    resetLevel()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily:
          "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      }}
    >
      <style>{`
        @media (max-width: 600px) {
          .game-container {
            flex-direction: column !important;
          }
          .info-panel {
            flex-direction: row !important;
            margin-bottom: 20px !important;
            margin-right: 0 !important;
            width: 100% !important;
            justify-content: space-around !important;
            align-items: center !important;
          }
        }
      `}</style>

      <div
        className="game-container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 30,
        }}
      >
        <motion.div
          className="info-panel"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minWidth: 160,
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                color: GLOW_COLOR,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 4,
                opacity: 0.8,
              }}
            >
              Level
            </div>
            <div
              style={{
                color: GLOW_COLOR,
                fontSize: 42,
                fontWeight: 'bold',
                textShadow: `0 0 20px ${GLOW_COLOR}`,
                lineHeight: 1,
              }}
            >
              {level}
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                color: GLOW_COLOR,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 4,
                opacity: 0.8,
              }}
            >
              Moves
            </div>
            <div
              style={{
                color: GLOW_COLOR,
                fontSize: 36,
                fontWeight: 'bold',
                textShadow: `0 0 15px ${GLOW_COLOR}`,
                lineHeight: 1,
              }}
            >
              {moves}
            </div>
          </div>

          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 20px',
              backgroundColor: 'transparent',
              border: `2px solid ${GLOW_COLOR}`,
              borderRadius: 50,
              color: GLOW_COLOR,
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `0 0 15px rgba(0, 255, 204, 0.3)`,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            <motion.svg
              animate={{ rotate: hasWon ? 360 : 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15.5 6.4L3 16" />
              <path d="M3 21v-5h5" />
            </motion.svg>
            Reset
          </motion.button>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: 'rgba(0, 255, 204, 0.1)',
              borderRadius: 8,
              borderLeft: `3px solid ${GLOW_COLOR}`,
            }}
          >
            <div
              style={{
                color: GLOW_COLOR,
                fontSize: 11,
                fontWeight: '600',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              How to Play
            </div>
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Click pipes to rotate them. Connect the source to the target to complete the level.
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GameBoard onCellClick={handleCellClick} />
        </motion.div>
      </div>
    </div>
  )
}

export default App
