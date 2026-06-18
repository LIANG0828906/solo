import { useEffect, useRef, useState, useCallback } from 'react'
import { GameEngine } from '../game/gameEngine'
import { Renderer } from '../game/renderer'
import { useGameStore } from '../store/useGameStore'

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [showStart, setShowStart] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [finalStats, setFinalStats] = useState({ score: 0, level: 1 })

  const { score, timeLeft, addScore, setTimeLeft, startGame, endGame, resetGame } = useGameStore()

  const handleResize = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return
    const canvas = canvasRef.current
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width
    canvas.height = height
    engineRef.current.setCanvasSize(width, height)
  }, [])

  const renderLoop = useCallback(() => {
    if (!rendererRef.current || !engineRef.current) return

    const engine = engineRef.current
    const renderer = rendererRef.current

    if (showStart) {
      renderer.drawStartScreen()
    } else if (gameOver) {
      renderer.render()
      renderer.drawGameOver(finalStats.score, finalStats.level)
    } else {
      renderer.render()

      const state = engine.getState()
      if (state.score !== score) {
        addScore(state.score - score)
      }
      if (Math.ceil(state.timeLeft) !== Math.ceil(timeLeft)) {
        setTimeLeft(state.timeLeft)
      }
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop)
  }, [showStart, gameOver, finalStats, score, timeLeft, addScore, setTimeLeft])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (showStart) {
      setShowStart(false)
      engineRef.current.start()
      startGame()
      return
    }

    if (gameOver) return

    engineRef.current.handleMouseDown(x, y)
  }, [showStart, gameOver, startGame])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    engineRef.current.handleMouseMove(x, y)
  }, [])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || showStart || gameOver) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    engineRef.current.handleMouseUp(x, y)
  }, [showStart, gameOver])

  const handleRestart = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.reset()
    engineRef.current.start()
    setGameOver(false)
    resetGame()
  }, [resetGame])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const engine = new GameEngine()
    const renderer = new Renderer(ctx, engine)

    engineRef.current = engine
    rendererRef.current = renderer

    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width
    canvas.height = height
    engine.setCanvasSize(width, height)

    engine.setGameOverCallback(() => {
      const state = engine.getState()
      setFinalStats({ score: state.score, level: state.level })
      setGameOver(true)
      endGame()
    })

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      engine.stop()
    }
  }, [handleResize, endGame])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderLoop)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [renderLoop])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'block',
          cursor: showStart ? 'pointer' : 'crosshair',
          width: '100%',
          height: '100%'
        }}
      />
      {gameOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <button
            onClick={handleRestart}
            style={{
              pointerEvents: 'auto',
              marginTop: '180px',
              padding: '14px 40px',
              fontSize: '20px',
              fontFamily: '"Courier New", monospace',
              fontWeight: 'bold',
              backgroundColor: 'transparent',
              color: '#00FF7F',
              border: '2px solid #00FF7F',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00FF7F'
              e.currentTarget.style.color = '#000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#00FF7F'
            }}
          >
            RESTART
          </button>
        </div>
      )}
    </div>
  )
}

export default GameCanvas
