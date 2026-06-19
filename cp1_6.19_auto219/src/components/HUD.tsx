import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, JudgmentType } from '../store/gameStore'

export const HUD = () => {
  const score = useGameStore((state) => state.score)
  const lives = useGameStore((state) => state.lives)
  const energy = useGameStore((state) => state.energy)
  const maxEnergy = useGameStore((state) => state.maxEnergy)
  const lastJudgment = useGameStore((state) => state.lastJudgment)
  const gameState = useGameStore((state) => state.gameState)
  const beatTime = useGameStore((state) => state.beatTime)
  const beatInterval = useGameStore((state) => state.beatInterval)

  const energyPercentage = (energy / maxEnergy) * 100
  const isEnergyFull = energy >= maxEnergy
  const beatProgress = beatTime / beatInterval
  const isNearBeat = beatProgress < 0.15 || beatProgress > 0.85

  const getJudgmentColor = (judgment: JudgmentType) => {
    switch (judgment) {
      case 'perfect':
        return '#FFD700'
      case 'good':
        return '#00FF00'
      case 'miss':
        return '#FF0000'
      default:
        return '#FFFFFF'
    }
  }

  const getJudgmentText = (judgment: JudgmentType) => {
    switch (judgment) {
      case 'perfect':
        return 'PERFECT!'
      case 'good':
        return 'GOOD!'
      case 'miss':
        return 'MISS'
      default:
        return ''
    }
  }

  if (gameState !== 'playing') return null

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#FFFFFF',
            textShadow: '2px 2px 0 #000000',
          }}
        >
          SCORE: {score.toString().padStart(6, '0')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#888',
            }}
          >
            ENERGY
          </div>
          <div
            style={{
              width: '200px',
              height: '16px',
              backgroundColor: '#333333',
              border: '1px solid #555',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={isEnergyFull ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
              transition={isEnergyFull ? { duration: 0.5, repeat: Infinity } : {}}
              style={{
                height: '100%',
                width: `${energyPercentage}%`,
                background: 'linear-gradient(to right, #FFD700, #FF8C00)',
                transition: 'width 0.2s ease-out',
              }}
            />
          </div>
          {isEnergyFull && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#FFD700',
              }}
            >
              PRESS SPACE!
            </motion.div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#888',
          }}
        >
          RHYTHM
        </div>
        <div
          style={{
            width: '80px',
            height: '12px',
            backgroundColor: '#222',
            border: '1px solid #444',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ left: '0%' }}
            transition={{ duration: beatInterval, ease: 'linear', repeat: Infinity }}
            style={{
              position: 'absolute',
              top: 0,
              width: '3px',
              height: '100%',
              backgroundColor: isNearBeat ? '#FFD700' : '#666',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#888',
          }}
        >
          LIVES
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={i < lives ? { scale: 1 } : { scale: 0.8 }}
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: i < lives ? '#FF3333' : '#333333',
                border: '1px solid #666',
                imageRendering: 'pixelated',
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lastJudgment && (
          <motion.div
            key={lastJudgment + Math.random()}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -30, scale: 1.2 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'monospace',
              fontSize: '28px',
              fontWeight: 'bold',
              color: getJudgmentColor(lastJudgment),
              textShadow: '2px 2px 0 #000000, -1px -1px 0 #000000',
              whiteSpace: 'nowrap',
            }}
          >
            {getJudgmentText(lastJudgment)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
