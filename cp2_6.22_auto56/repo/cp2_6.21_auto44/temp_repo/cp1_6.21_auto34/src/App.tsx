import React, { useState, useRef, useCallback, useEffect } from 'react'
import GameBoard, { GameStateSnapshot, GameBoardHandle } from './components/GameBoard'
import GameUI from './components/GameUI'

const initialState: GameStateSnapshot = {
  score: 0,
  combo: 0,
  nextRune: 'red',
  skills: [
    { id: 'firestorm', name: '烈焰风暴', icon: '🔥', color: '#ff4757', fragments: 0, maxFragments: 20 },
    { id: 'double', name: '双倍祝福', icon: '✨', color: '#ffd700', fragments: 0, maxFragments: 12 },
  ],
  gameOver: false,
  totalCleared: 0,
}

const App: React.FC = () => {
  const gameBoardRef = useRef<GameBoardHandle>(null)
  const [gameState, setGameState] = useState<GameStateSnapshot>(initialState)

  const handleStateChange = useCallback((state: GameStateSnapshot) => {
    setGameState(state)
  }, [])

  const handleUseSkill = useCallback((skillId: string) => {
    if (gameBoardRef.current) {
      gameBoardRef.current.useSkill(skillId)
    }
  }, [])

  const handleRestart = useCallback(() => {
    if (gameBoardRef.current) {
      gameBoardRef.current.reset()
    }
  }, [])

  useEffect(() => {
    if (gameBoardRef.current) {
      const state = gameBoardRef.current.getState()
      setGameState(state)
    }
  }, [])

  return (
    <div className="app-container">
      <GameUI
        state={gameState}
        onUseSkill={handleUseSkill}
        onRestart={handleRestart}
      >
        <GameBoard
          ref={gameBoardRef}
          onStateChange={handleStateChange}
        />
      </GameUI>
    </div>
  )
}

export default App
