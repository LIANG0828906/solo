import { useEffect, useRef } from 'react'
import { GameEngine } from './GameEngine'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current)
    engineRef.current = engine
    engine.init()

    return () => {
      engine.destroy()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        background: '#0D1B2A'
      }}
    />
  )
}

export default App
