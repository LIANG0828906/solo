import { useEffect, useRef } from 'react'
import { GameCore } from './game-core'
import { useGameStore } from './ui-controller'
import StatusBar from './components/StatusBar'
import GameOver from './components/GameOver'
import Victory from './components/Victory'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameCore | null>(null)
  const gameStatus = useGameStore((state) => state.gameStatus)
  const resetGame = useGameStore((state) => state.resetGame)
  const setGameStatus = useGameStore((state) => state.setGameStatus)
  const incrementScore = useGameStore((state) => state.incrementScore)
  const decrementLife = useGameStore((state) => state.decrementLife)
  const incrementCombo = useGameStore((state) => state.incrementCombo)
  const checkComboTimeout = useGameStore((state) => state.checkComboTimeout)
  const setAsteroidsRemaining = useGameStore((state) => state.setAsteroidsRemaining)
  const lives = useGameStore((state) => state.lives)
  const startLifeFlash = useGameStore((state) => state.startLifeFlash)
  const stopLifeFlash = useGameStore((state) => state.stopLifeFlash)

  useEffect(() => {
    if (!canvasRef.current) return

    const game = new GameCore(canvasRef.current, {
      onScore: (points) => incrementScore(points),
      onLifeLost: () => {
        startLifeFlash()
        setTimeout(() => stopLifeFlash(), 900)
        decrementLife()
      },
      onComboHit: () => incrementCombo(),
      onAsteroidCountChange: (count) => setAsteroidsRemaining(count),
      onVictory: () => setGameStatus('victory'),
    })

    gameRef.current = game
    game.start()

    const handleKeyDown = (e: KeyboardEvent) => {
      game.handleKeyDown(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      game.handleKeyUp(e.key)
    }

    const handleClick = () => {
      game.handleClick()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvasRef.current.addEventListener('click', handleClick)

    const comboInterval = setInterval(() => {
      checkComboTimeout()
    }, 100)

    return () => {
      game.stop()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvasRef.current?.removeEventListener('click', handleClick)
      clearInterval(comboInterval)
    }
  }, [])

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.setGameOver(gameStatus !== 'playing')
    }
  }, [gameStatus])

  useEffect(() => {
    if (lives <= 0 && gameStatus === 'playing') {
      setGameStatus('gameover')
    }
  }, [lives, gameStatus, setGameStatus])

  const handleRestart = () => {
    resetGame()
    gameRef.current?.reset()
  }

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      <StatusBar />
      {gameStatus === 'gameover' && <GameOver onRestart={handleRestart} />}
      {gameStatus === 'victory' && <Victory onRestart={handleRestart} />}
    </div>
  )
}
