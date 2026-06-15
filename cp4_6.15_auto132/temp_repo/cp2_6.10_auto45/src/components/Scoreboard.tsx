import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

const Scoreboard: React.FC = () => {
  const { totalScores, seatLevel, currentRound, arrowsRemaining, seatProgress } = useGameStore()

  const scoreSticks = Array.from({ length: Math.min(totalScores, 10) }, (_, i) => i)

  return (
    <>
      <div className="round-info">
        <div>第 {currentRound} 轮</div>
        <div className="arrows-remaining">
          {Array.from({ length: arrowsRemaining }, (_, i) => (
            <div key={i} className="arrow-icon" />
          ))}
        </div>
        <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>
          晋升进度: {seatProgress}/5
        </div>
      </div>

      <div className="scoreboard">
        <div className="scoreboard-content">
          <div className="score-title">筹签</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={totalScores}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="score-value"
            >
              {totalScores}
            </motion.div>
          </AnimatePresence>
          <div className="score-sticks">
            {scoreSticks.map((i) => (
              <motion.div
                key={i}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 20, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="score-stick"
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={seatLevel}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="seat-display"
        >
          <div className="seat-title">座次</div>
          <div className="seat-level">{seatLevel}</div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default Scoreboard
