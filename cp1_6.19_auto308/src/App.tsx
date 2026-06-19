import { useEffect, useRef, useState } from 'react'
import { useGameStore } from './store'
import { render } from './rendering'
import DebugPanel from './DebugPanel'
import './App.css'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [debugPanelOpen, setDebugPanelOpen] = useState(false)
  const lastTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)

  const setGameSize = useGameStore((s) => s.setGameSize)
  const tick = useGameStore((s) => s.tick)
  const setKey = useGameStore((s) => s.setKey)
  const gameWidth = useGameStore((s) => s.gameWidth)
  const gameHeight = useGameStore((s) => s.gameHeight)
  const gameOver = useGameStore((s) => s.gameOver)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key.startsWith('Arrow')) {
        e.preventDefault()
      }
      setKey(e.key, true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      setKey(e.key, false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = gameContainerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const dpr = window.devicePixelRatio || 1

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      setGameSize(width, height)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [setGameSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = timestamp

      tick(dt, timestamp)

      const state = useGameStore.getState()
      render(ctx, state, timestamp)

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [tick])

  return (
    <div className="app-container">
      {!isSmallScreen && (
        <div className="left-panel">
          <div className="panel-card">
            <h3>操作说明</h3>
            <ul className="controls-list">
              <li><span className="key">W A S D</span> 移动飞船</li>
              <li><span className="key">空格</span> 释放护盾</li>
              <li><span className="key">护盾</span> 弹开弹幕 +10分</li>
            </ul>
          </div>
          <div className="panel-card">
            <h3>游戏目标</h3>
            <p>躲避Boss的弹幕和小兵，用护盾弹开敌人获得分数。生命归零则游戏重置。</p>
          </div>
        </div>
      )}

      <div className="game-area">
        <div className="game-container" ref={gameContainerRef}>
          <canvas ref={canvasRef} className="game-canvas" />
        </div>
      </div>

      {!isSmallScreen ? (
        <div className="right-panel">
          <DebugPanel />
        </div>
      ) : (
        <button
          className="debug-toggle-btn"
          onClick={() => setDebugPanelOpen(!debugPanelOpen)}
        >
          {debugPanelOpen ? '收起调试面板' : '展开调试面板'}
        </button>
      )}

      {isSmallScreen && debugPanelOpen && (
        <div className="bottom-drawer">
          <DebugPanel />
        </div>
      )}
    </div>
  )
}
