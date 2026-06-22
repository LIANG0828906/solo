import { useEffect, useRef } from 'react'
import { GameEngine } from './gameEngine'
import { useGameStore } from './store'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const gameState = useGameStore((s) => s.gameState)
  const score = useGameStore((s) => s.score)
  const lives = useGameStore((s) => s.lives)
  const level = useGameStore((s) => s.level)
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const setGameState = useGameStore((s) => s.setGameState)
  const addScore = useGameStore((s) => s.addScore)
  const setLives = useGameStore((s) => s.setLives)
  const setLevel = useGameStore((s) => s.setLevel)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const resetGame = useGameStore((s) => s.resetGame)

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current)
    engineRef.current = engine

    engine.onScoreChange = (s) => {
      const store = useGameStore.getState()
      if (store.score !== s) {
        useGameStore.setState({ score: s })
      }
    }
    engine.onLivesChange = (l) => {
      useGameStore.setState({ lives: l })
    }
    engine.onLevelChange = (l) => {
      useGameStore.setState({ level: l })
    }
    engine.onGameOver = () => {
      useGameStore.setState({ gameState: 'gameover' })
    }
    engine.onGameStateChange = (s) => {
      useGameStore.setState({ gameState: s })
    }

    const handleSoundToggle = (e: Event) => {
      const ce = e as CustomEvent<boolean>
      useGameStore.setState({ soundEnabled: ce.detail })
    }
    window.addEventListener('soundToggle', handleSoundToggle as EventListener)

    engine.startGame()
    useGameStore.setState({ gameState: 'playing' })

    return () => {
      window.removeEventListener('soundToggle', handleSoundToggle as EventListener)
      engine.destroy()
    }
  }, [])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSoundEnabled(soundEnabled)
    }
  }, [soundEnabled])

  const handleStart = () => {
    resetGame()
    engineRef.current?.startGame()
  }

  const handleResume = () => {
    setGameState('playing')
    engineRef.current?.setGameState('playing')
  }

  const handleRestart = () => {
    resetGame()
    engineRef.current?.startGame()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      />

      {gameState === 'menu' && (
        <div style={overlayStyle}>
          <div style={panelStyle}>
            <h1 style={{ ...titleStyle, color: '#4FC3F7' }}>弹幕射击</h1>
            <p style={subtitleStyle}>Bullet Hell Shooter</p>
            <div style={instructionsStyle}>
              <p>🎮 WASD / 方向键 移动</p>
              <p>🔫 空格键 射击</p>
              <p>⏸️ Esc 暂停</p>
            </div>
            <button style={buttonStyle} onClick={handleStart}>
              开始游戏
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div style={overlayStyle}>
          <div style={panelStyle}>
            <h1 style={{ ...titleStyle, color: '#FF4444' }}>游戏结束</h1>
            <div style={scoreBoxStyle}>
              <p style={{ fontSize: '18px', color: '#AAAAAA', marginBottom: '8px' }}>最终得分</p>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#FFD700' }}>{score}</p>
            </div>
            <button style={buttonStyle} onClick={handleRestart}>
              重新开始
            </button>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
          onClick={(e) => {
            const cw = window.innerWidth
            const ch = window.innerHeight
            const x = e.clientX
            const y = e.clientY
            const btnW = 140, btnH = 48
            const btnX = cw / 2 - btnW / 2
            const btnY = ch / 2 + 20
            if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
              handleResume()
            }
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
          </div>
        </div>
      )}
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(11, 12, 16, 0.85)',
  backdropFilter: 'blur(4px)',
  zIndex: 10
}

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a1d23 0%, #0f1115 100%)',
  borderRadius: '16px',
  padding: '48px 56px',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(79, 195, 247, 0.1)',
  textAlign: 'center',
  minWidth: '360px',
  border: '1px solid rgba(79, 195, 247, 0.2)'
}

const titleStyle: React.CSSProperties = {
  fontSize: '42px',
  fontWeight: 'bold',
  margin: 0,
  marginBottom: '8px',
  textShadow: '0 0 24px currentColor'
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#888',
  margin: 0,
  marginBottom: '32px',
  letterSpacing: '2px'
}

const instructionsStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '32px',
  color: '#CCCCCC',
  fontSize: '15px',
  lineHeight: 2
}

const scoreBoxStyle: React.CSSProperties = {
  margin: '24px 0 32px 0',
  padding: '20px',
  background: 'rgba(255, 215, 0, 0.05)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 215, 0, 0.2)'
}

const buttonStyle: React.CSSProperties = {
  padding: '14px 48px',
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#FFFFFF',
  background: 'linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%)',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(79, 195, 247, 0.4)',
  transition: 'all 0.2s ease',
  letterSpacing: '1px'
}
