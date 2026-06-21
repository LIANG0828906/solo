import { useEffect, useRef, useState } from 'react'
import { GameEngine, type GameState } from './GameEngine'
import HUD from './HUD'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const stateUpdateRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new GameEngine(canvas)
    engineRef.current = engine
    setGameState(engine.getState())

    const handleResize = () => {
      engine.resize()
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      engine.handleInput(x)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect()
        const x = e.touches[0].clientX - rect.left
        engine.handleInput(x)
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect()
        const x = e.touches[0].clientX - rect.left
        engine.handleInput(x)
      }
    }

    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })

    engine.start()

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = timestamp

      engine.update(deltaTime)
      engine.render()

      stateUpdateRef.current += deltaTime
      if (stateUpdateRef.current > 0.1) {
        setGameState(engine.getState())
        stateUpdateRef.current = 0
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      engine.stop()
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchstart', handleTouchStart)
    }
  }, [])

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      engineRef.current.start()
      setGameState(engineRef.current.getState())
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'none',
          touchAction: 'none'
        }}
      />
      {gameState && <HUD gameState={gameState} onRestart={handleRestart} />}
    </div>
  )
}

export default App
