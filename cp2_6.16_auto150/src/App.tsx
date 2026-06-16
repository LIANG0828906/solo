import React, { useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '@/game/GameEngine'
import HUD from '@/ui/HUD'
import { useGameStore } from '@/store/gameStore'

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    useGameStore.getState().loadFromStorage()
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current)
    engineRef.current = engine
    engine.start()

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      engine.stop()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => state.status,
      (status, prev) => {
        if (status === 'playing' && prev !== 'playing') {
          engineRef.current?.reset()
        }
      }
    )
    return unsub
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (useGameStore.getState().status !== 'playing') return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    engineRef.current?.setPointer(true, y)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (useGameStore.getState().status !== 'playing') return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    if (e.buttons > 0 || e.pointerType === 'touch') {
      engineRef.current?.setPointer(true, y)
    } else {
      engineRef.current?.setPointer(true, y)
    }
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    engineRef.current?.setPointer(false, 0)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        const status = useGameStore.getState().status
        if (status === 'playing') {
          useGameStore.getState().pauseGame()
        } else if (status === 'paused') {
          useGameStore.getState().resumeGame()
        }
      }
      if (e.code === 'Space' && useGameStore.getState().status !== 'playing') {
        e.preventDefault()
        useGameStore.getState().startGame()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="game-root">
      <div
        ref={containerRef}
        className="game-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas ref={canvasRef} className="game-canvas" />
        <HUD />
      </div>
      <style>{rootStyles}</style>
    </div>
  )
}

const rootStyles = `
.game-root {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E0F2FE;
}

.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1600px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

@media (min-width: 1024px) {
  .game-container {
    width: 95%;
    height: 90%;
    border-radius: 20px;
    box-shadow: 0 25px 80px rgba(0,0,0,0.4);
  }
}
`

export default App
