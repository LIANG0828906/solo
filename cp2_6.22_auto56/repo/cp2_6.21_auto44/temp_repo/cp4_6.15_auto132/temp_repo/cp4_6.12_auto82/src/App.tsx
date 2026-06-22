import { useEffect, useRef, useState, useCallback } from 'react'
import { GameEngine } from './GameEngine'
import type { GameState } from './GameEngine'
import { GameRenderer } from './GameRenderer'
import { GameController } from './GameController'
import './App.css'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const minimapRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const rendererRef = useRef<GameRenderer | null>(null)
  const controllerRef = useRef<GameController | null>(null)
  const rafRef = useRef<number>(0)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerCount, setPlayerCount] = useState(4)
  const [showMenu, setShowMenu] = useState(true)
  const [showEndPanel, setShowEndPanel] = useState(false)
  const [winnerName, setWinnerName] = useState('')
  const [winnerColor, setWinnerColor] = useState('#ffffff')
  const [isMVP, setIsMVP] = useState(false)
  const gameContainerRef = useRef<HTMLDivElement>(null)

  const initEngine = useCallback((count: number) => {
    const engine = new GameEngine(count)
    engineRef.current = engine
    setGameState({ ...engine.getState() })
    return engine
  }, [])

  const initRenderer = useCallback(() => {
    if (!canvasRef.current) return null
    const renderer = new GameRenderer(canvasRef.current, minimapRef.current ?? undefined)
    rendererRef.current = renderer
    return renderer
  }, [])

  const initController = useCallback((engine: GameEngine, count: number) => {
    const controller = new GameController(engine, count)
    controllerRef.current = controller
    return controller
  }, [])

  useEffect(() => {
    initRenderer()
    initEngine(playerCount)
  }, [initRenderer, initEngine, playerCount])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      controllerRef.current?.detach()
    }
  }, [])

  const gameLoop = useCallback(() => {
    if (!engineRef.current || !rendererRef.current || !controllerRef.current) {
      rafRef.current = requestAnimationFrame(gameLoop)
      return
    }

    controllerRef.current.flushQueue()
    engineRef.current.tick()
    const state = engineRef.current.getState()
    rendererRef.current.render(state)
    setGameState({ ...state })

    if (state.gameStatus === 'ended') {
      if (state.winner) {
        setWinnerName(state.winner.name)
        setWinnerColor(state.winner.color)
      }
      const alive = state.snakes.filter(s => s.isAlive).length
      setIsMVP(alive !== 1)
      setShowEndPanel(true)
      return
    }

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [])

  const startGame = useCallback(() => {
    if (!engineRef.current) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    controllerRef.current?.detach()

    engineRef.current.reset(playerCount)
    const engine = engineRef.current
    engine.start()

    const controller = initController(engine, playerCount)
    controller.attach()

    setShowMenu(false)
    setShowEndPanel(false)
    rafRef.current = requestAnimationFrame(gameLoop)
  }, [playerCount, initController, gameLoop])

  const restartGame = useCallback(() => {
    setShowEndPanel(false)
    setShowMenu(true)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    controllerRef.current?.detach()
  }, [])

  const rankedSnakes = gameState
    ? [...gameState.snakes]
        .map(s => ({ ...s, finalScore: s.score }))
        .sort((a, b) => {
          if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1
          return b.score - a.score
        })
    : []

  return (
    <div className="app-root">
      <div className="game-layout">
        <div className="hud-left">
          <div className="scoreboard">
            <div className="scoreboard-title">实时排名</div>
            <div className="scoreboard-list">
              {rankedSnakes.map((snake, idx) => (
                <div
                  key={snake.id}
                  className={`score-row ${!snake.isAlive ? 'dead' : ''}`}
                >
                  <span className="rank">#{idx + 1}</span>
                  <span
                    className="color-dot"
                    style={{ backgroundColor: snake.color }}
                  />
                  <span className="player-name">{snake.name}</span>
                  <span className="player-score">{snake.score}</span>
                  {!snake.isAlive && <span className="dead-tag">淘汰</span>}
                  {snake.speedBoost && snake.isAlive && (
                    <span className="boost-tag">⚡</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="timer-box">
            <div className="timer-label">剩余时间</div>
            <div className={`timer-value ${gameState && gameState.timeRemaining < 30 ? 'low' : ''}`}>
              {formatTime(gameState?.timeRemaining ?? 120)}
            </div>
          </div>
        </div>

        <div className="game-center" ref={gameContainerRef}>
          <div className="canvas-frame">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="game-canvas"
            />
            {showMenu && (
              <div className="menu-overlay">
                <div className="menu-card">
                  <h1 className="neon-title">贪吃蛇大逃杀</h1>
                  <div className="player-select">
                    <div className="select-label">选择玩家数量</div>
                    <div className="player-buttons">
                      {[4, 5, 6].map(n => (
                        <button
                          key={n}
                          className={`count-btn ${playerCount === n ? 'active' : ''}`}
                          onClick={() => setPlayerCount(n)}
                        >
                          {n}人
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="start-btn" onClick={startGame}>
                    开始游戏
                  </button>
                  <div className="controls-hint">
                    玩家1: WASD | 玩家2: 方向键<br />
                    玩家3: T/G/F/H | 玩家4: I/K/J/L<br />
                    玩家5: 小键盘 8/5/4/6 | 玩家6: O/M/N/B
                  </div>
                </div>
              </div>
            )}
            {showEndPanel && (
              <div className="end-overlay">
                <div className="end-panel">
                  <div className="crown-icon">👑</div>
                  <div className="winner-label">
                    {isMVP ? 'MVP 胜利者' : '胜利者'}
                    {isMVP && <span className="mvp-badge">MVP</span>}
                  </div>
                  <div
                    className="winner-name"
                    style={{ color: winnerColor, textShadow: `0 0 12px ${winnerColor}` }}
                  >
                    {winnerName}
                  </div>
                  <button className="restart-btn" onClick={restartGame}>
                    再来一局
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hud-right">
          <div className="minimap-wrapper">
            <div className="minimap-title">战场小地图</div>
            <canvas
              ref={minimapRef}
              width={200}
              height={150}
              className="minimap-canvas"
            />
            <div className="legend">
              <div className="legend-item">
                <span className="legend-dot green" /> 食物
              </div>
              <div className="legend-item">
                <span className="legend-dot purple" /> 加速
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
