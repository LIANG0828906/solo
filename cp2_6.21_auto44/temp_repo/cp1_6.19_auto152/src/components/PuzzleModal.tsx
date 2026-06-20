import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Puzzle } from '../hooks/useGameState'

interface PuzzleModalProps {
  puzzle: Puzzle | null
  onClose: () => void
  onSolve: (puzzleId: string, answer: string) => boolean
}

interface Particle {
  id: number
  x: number
  y: number
  color: string
  angle: number
  distance: number
}

export default function PuzzleModal({ puzzle, onClose, onSolve }: PuzzleModalProps) {
  const [answer, setAnswer] = useState('')
  const [isSolved, setIsSolved] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (puzzle) {
      setAnswer('')
      setIsSolved(false)
      setParticles([])
      setShowError(false)
    }
  }, [puzzle])

  const handleSubmit = () => {
    if (!puzzle) return

    const success = onSolve(puzzle.id, answer)
    if (success) {
      setIsSolved(true)
      createParticles()
    } else {
      setShowError(true)
      setTimeout(() => setShowError(false), 500)
    }
  }

  const createParticles = () => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    const newParticles: Particle[] = []
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15 + Math.random() * 0.5
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle,
        distance: 60 + Math.random() * 40
      })
    }
    setParticles(newParticles)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <AnimatePresence>
      {puzzle && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            className="puzzle-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            style={showError ? { animation: 'shake 0.5s ease' } : {}}
          >
            <button
              className="close-puzzle-btn"
              onClick={onClose}
            >
              ✕
            </button>

            <div className="particles-container">
              {particles.map(particle => (
                <motion.div
                  key={particle.id}
                  className="particle"
                  style={{ backgroundColor: particle.color }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos(particle.angle) * particle.distance,
                    y: Math.sin(particle.angle) * particle.distance,
                    opacity: 0
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ))}
            </div>

            {isSolved ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16
              }}>
                <motion.div
                  className="success-message"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  🎉 解锁成功！
                </motion.div>
                <p style={{ color: '#5D4037', fontSize: 14 }}>
                  这条线索已经被标记为已使用
                </p>
                <button
                  className="submit-btn"
                  onClick={onClose}
                  style={{ marginTop: 16 }}
                >
                  继续探索
                </button>
              </div>
            ) : (
              <>
                <h3>{puzzle.title}</h3>
                <p className="puzzle-desc">{puzzle.description}</p>
                <div className="input-container">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={puzzle.type === 'password' ? '输入密码...' : '输入答案...'}
                    autoFocus
                    style={{
                      borderColor: showError ? '#E74C3C' : undefined
                    }}
                  />
                  <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={!answer}
                  >
                    确认
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
