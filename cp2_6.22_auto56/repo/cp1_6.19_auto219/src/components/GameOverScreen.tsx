import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

interface GameOverScreenProps {
  onRestart: () => void
}

export const GameOverScreen = ({ onRestart }: GameOverScreenProps) => {
  const score = useGameStore((state) => state.score)
  const perfectCount = useGameStore((state) => state.perfectCount)
  const goodCount = useGameStore((state) => state.goodCount)
  const missCount = useGameStore((state) => state.missCount)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{
          fontFamily: 'monospace',
          fontSize: '48px',
          color: '#FFFFFF',
          textShadow: '4px 4px 0 #FF0000',
          marginBottom: '40px',
          letterSpacing: '4px',
        }}
      >
        GAME OVER
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          fontFamily: 'monospace',
          fontSize: '24px',
          color: '#FFD700',
          marginBottom: '20px',
          textShadow: '2px 2px 0 #000000',
        }}
      >
        FINAL SCORE: {score.toString().padStart(6, '0')}
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#AAA',
          marginBottom: '8px',
        }}
      >
        <span style={{ color: '#FFD700' }}>PERFECT:</span> {perfectCount}
        {'  '}
        <span style={{ color: '#00FF00' }}>GOOD:</span> {goodCount}
        {'  '}
        <span style={{ color: '#FF0000' }}>MISS:</span> {missCount}
      </motion.div>

      <motion.button
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, type: 'spring' }}
        whileHover={{ scale: 1.05, backgroundColor: '#FFFFFF', color: '#000000' }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        style={{
          marginTop: '40px',
          width: '160px',
          height: '40px',
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          border: '2px solid #FFFFFF',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '2px',
        }}
      >
        再玩一次
      </motion.button>
    </motion.div>
  )
}
