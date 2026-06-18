import { useEffect, useRef } from 'react'
import { GameRenderer } from './renderer'
import { useGameStore } from './gameState'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameRenderer | null>(null)
  const setScore = useGameStore((state) => state.setScore)
  const setGameOver = useGameStore((state) => state.setGameOver)
  const resetGame = useGameStore((state) => state.resetGame)

  useEffect(() => {
    if (!canvasRef.current) return

    const game = new GameRenderer(canvasRef.current)
    gameRef.current = game

    game.onScoreChange = (score) => setScore(score)
    game.onGameOverChange = (over) => setGameOver(over)

    game.start()

    return () => {
      game.stop()
    }
  }, [setScore, setGameOver])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #1F2833',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0, 255, 209, 0.2)',
        }}
      />
    </div>
  )
}
