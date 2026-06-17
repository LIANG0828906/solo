import { useGameStore } from '../stores/gameStore'

const BUTTON_STYLE: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: '10px',
  padding: '10px 20px',
  background: 'transparent',
  color: '#00FF00',
  border: '2px solid #00FF00',
  cursor: 'pointer',
  letterSpacing: '1px',
  transition: 'transform 0.08s ease, background 0.15s ease, color 0.15s ease',
  outline: 'none',
  userSelect: 'none',
  minWidth: '120px',
  borderRadius: '2px',
}

const BUTTON_ACTIVE_STYLE: React.CSSProperties = {
  ...BUTTON_STYLE,
  background: '#00FF00',
  color: '#1A1A2E',
  transform: 'scale(0.95)',
}

interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
}

function PixelButton({ children, onClick, active }: ButtonProps) {
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget
    target.style.transform = 'scale(0.95)'
    target.style.background = '#00FF00'
    target.style.color = '#1A1A2E'
  }
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget
    target.style.transform = 'scale(1)'
    if (!active) {
      target.style.background = 'transparent'
      target.style.color = '#00FF00'
    }
  }
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget
    target.style.transform = 'scale(1)'
    if (!active) {
      target.style.background = 'transparent'
      target.style.color = '#00FF00'
    }
  }

  return (
    <button
      style={active ? BUTTON_ACTIVE_STYLE : BUTTON_STYLE}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  )
}

function ControlPanel() {
  const gameStatus = useGameStore((s) => s.gameStatus)
  const mode = useGameStore((s) => s.mode)
  const setMode = useGameStore((s) => s.setMode)
  const initializeGame = useGameStore((s) => s.initializeGame)
  const pause = useGameStore((s) => s.pause)
  const resume = useGameStore((s) => s.resume)
  const restart = useGameStore((s) => s.restart)

  const handleStart = (selectedMode: 'single' | 'coop') => {
    setMode(selectedMode)
    initializeGame(selectedMode)
  }

  const handlePauseResume = () => {
    if (gameStatus === 'playing') {
      pause()
    } else if (gameStatus === 'paused') {
      resume()
    }
  }

  const showStartScreen = gameStatus === 'idle'
  const isPlaying = gameStatus === 'playing'
  const isPaused = gameStatus === 'paused'
  const isEnded = gameStatus === 'gameover' || gameStatus === 'win'

  return (
    <div
      style={{
        width: '100%',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        background: '#16213E',
        borderTop: '2px solid #0F3460',
        fontFamily: "'Press Start 2P', monospace",
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {showStartScreen && (
        <>
          <PixelButton onClick={() => handleStart('single')}>SINGLE PLAYER</PixelButton>
          <PixelButton onClick={() => handleStart('coop')}>2 PLAYERS COOP</PixelButton>
          <div
            style={{
              marginLeft: '20px',
              fontSize: '8px',
              color: '#9D4EDD',
              textAlign: 'left',
              lineHeight: '1.8',
            }}
          >
            <div>P1: W A S D 或 方向键</div>
            <div>P2: 方向键 (双人模式)</div>
            <div>ESC/P: 暂停</div>
          </div>
        </>
      )}

      {(isPlaying || isPaused) && (
        <>
          <PixelButton onClick={handlePauseResume} active={isPaused}>
            {isPaused ? 'RESUME' : 'PAUSE'}
          </PixelButton>
          <PixelButton onClick={restart}>RESTART</PixelButton>
          <div
            style={{
              marginLeft: '20px',
              fontSize: '9px',
              color: mode === 'coop' ? '#00D4AA' : '#FFE135',
            }}
          >
            MODE: {mode === 'coop' ? 'CO-OP' : 'SINGLE'}
          </div>
        </>
      )}

      {isEnded && (
        <>
          <div
            style={{
              fontSize: '12px',
              color: gameStatus === 'win' ? '#00FFFF' : '#FF0000',
              marginRight: '20px',
              letterSpacing: '2px',
            }}
          >
            {gameStatus === 'win' ? '🎉 YOU WIN! 🎉' : '💀 GAME OVER 💀'}
          </div>
          <PixelButton onClick={() => handleStart('single')}>SINGLE</PixelButton>
          <PixelButton onClick={() => handleStart('coop')}>CO-OP</PixelButton>
        </>
      )}
    </div>
  )
}

export default ControlPanel
