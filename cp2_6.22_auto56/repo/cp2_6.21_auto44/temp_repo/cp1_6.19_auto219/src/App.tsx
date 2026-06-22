import { useEffect, useRef } from 'react'
import { useGameStore } from './store/gameStore'
import { useGameLoop } from './hooks/useGameLoop'
import { GameCanvas } from './components/GameCanvas'
import { HUD } from './components/HUD'
import { MenuScreen } from './components/MenuScreen'
import { GameOverScreen } from './components/GameOverScreen'
import { TopGradientBar } from './components/TopGradientBar'

function App() {
  const gameState = useGameStore((state) => state.gameState)
  const startGame = useGameStore((state) => state.startGame)
  const resetGame = useGameStore((state) => state.resetGame)
  const switchLane = useGameStore((state) => state.switchLane)
  const releaseEnergy = useGameStore((state) => state.releaseEnergy)
  const containerRef = useRef<HTMLDivElement>(null)

  useGameLoop()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return

      if (gameState !== 'playing') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          if (gameState === 'menu') {
            startGame()
          } else if (gameState === 'gameover') {
            resetGame()
            startGame()
          }
        }
        return
      }

      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          e.preventDefault()
          switchLane(0)
          break
        case 'KeyS':
        case 'ArrowDown':
          e.preventDefault()
          switchLane(1)
          break
        case 'KeyD':
        case 'ArrowRight':
          e.preventDefault()
          switchLane(2)
          break
        case 'Space':
          e.preventDefault()
          releaseEnergy()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, startGame, resetGame, switchLane, releaseEnergy])

  const handleStart = () => {
    startGame()
  }

  const handleRestart = () => {
    resetGame()
    startGame()
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <TopGradientBar />

      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: '20px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '80%',
            maxWidth: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GameCanvas />
          <HUD />
        </div>
      </div>

      {gameState === 'menu' && <MenuScreen onStart={handleStart} />}
      {gameState === 'gameover' && <GameOverScreen onRestart={handleRestart} />}
    </div>
  )
}

export default App
