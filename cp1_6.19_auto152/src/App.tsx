import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Scene from './components/Scene'
import CluePanel from './components/CluePanel'
import PuzzleModal from './components/PuzzleModal'
import { useGameState, Clue, Puzzle } from './hooks/useGameState'

export default function App() {
  const {
    clues,
    puzzles,
    elapsedTime,
    gameWon,
    doorOpen,
    collectedCount,
    totalClues,
    collectClue,
    solvePuzzle,
    canSolvePuzzle,
    resetGame,
    formatTime
  } = useGameState()

  const [selectedClue, setSelectedClue] = useState<Clue | null>(null)
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null)

  const handleItemClick = useCallback((itemId: string) => {
    const clue = clues.find(c => c.itemId === itemId)
    if (clue) {
      if (!clue.collected) {
        collectClue(clue.id)
      }
      setSelectedClue(clue)

      setTimeout(() => {
        const availablePuzzle = puzzles.find(p =>
          !p.solved && canSolvePuzzle(p.id) &&
          (p.requiredClues.includes(clue.id) || clue.id === 'clockNote')
        )
        if (availablePuzzle && clue.collected) {
          // Don't auto-open puzzle, just let user discover it
        }
      }, 500)
    }
  }, [clues, puzzles, collectClue, canSolvePuzzle])

  const handleCloseClueModal = () => {
    setSelectedClue(null)

    const solvablePuzzles = puzzles.filter(p => !p.solved && canSolvePuzzle(p.id))
    if (solvablePuzzles.length > 0) {
      setTimeout(() => {
        setActivePuzzle(solvablePuzzles[0])
      }, 300)
    }
  }

  const handleSolvePuzzle = (puzzleId: string, answer: string): boolean => {
    return solvePuzzle(puzzleId, answer)
  }

  const handleClosePuzzle = () => {
    setActivePuzzle(null)
  }

  const handleReset = () => {
    if (window.confirm('确定要重新开始游戏吗？所有进度将会丢失。')) {
      resetGame()
      setSelectedClue(null)
      setActivePuzzle(null)
    }
  }

  return (
    <div className="app-container">
      <Scene
        clues={clues}
        doorOpen={doorOpen}
        onItemClick={handleItemClick}
      />

      <div className="top-bar">
        <div className="game-info">
          <div className="timer">
            ⏱️ {formatTime(elapsedTime)}
          </div>
          <div className="progress">
            📜 {collectedCount}/{totalClues}
          </div>
        </div>
        <motion.button
          className="reset-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          title="重新开始"
        >
          ↻
        </motion.button>
      </div>

      <CluePanel clues={clues} />

      <AnimatePresence>
        {selectedClue && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseClueModal()
            }}
          >
            <motion.div
              className="clue-modal"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            >
              <h3>
                <span className="clue-icon">{selectedClue.icon}</span>
                {selectedClue.title}
              </h3>
              <p className="description">{selectedClue.description}</p>
              <div className="hint">
                💡 关键提示：{selectedClue.hint}
              </div>
              <button className="close-btn" onClick={handleCloseClueModal}>
                {selectedClue.collected && selectedClue.used ? '关闭' : '继续探索'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PuzzleModal
        puzzle={activePuzzle}
        onClose={handleClosePuzzle}
        onSolve={handleSolvePuzzle}
      />

      <AnimatePresence>
        {gameWon && (
          <motion.div
            className="victory-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{ textAlign: 'center' }}
            >
              <div className="victory-title">逃出生天</div>
              <p className="victory-subtitle">恭喜你成功逃出了侦探的书房！</p>
              <p className="victory-time">
                用时：{formatTime(elapsedTime)}
              </p>
              <motion.button
                className="play-again-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
              >
                再玩一次
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
