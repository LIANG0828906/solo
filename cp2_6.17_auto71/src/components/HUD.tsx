import { useGameStore, PLAYER_COLORS, INITIAL_LIVES } from '../stores/gameStore'

const HEART_FILLED = '❤'
const HEART_EMPTY = '♡'

function HUD() {
  const players = useGameStore((s) => s.players)
  const gameStatus = useGameStore((s) => s.gameStatus)
  const mode = useGameStore((s) => s.mode)
  const dotsRemaining = useGameStore((s) => s.dotsRemaining)
  const level = useGameStore((s) => s.level)
  const pelletTimer = useGameStore((s) => s.pelletRespawnTimer)

  return (
    <div
      style={{
        width: '100%',
        height: '60px',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        gap: '12px',
        background: '#16213E',
        borderBottom: '2px solid #0F3460',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '10px',
        color: '#ffffff',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          minWidth: 0,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#9D4EDD', fontSize: '9px' }}>
              {mode === 'coop' ? 'P1' : 'SCORE'}
            </span>
            <span style={{ color: PLAYER_COLORS[0] }}>
              {String(players[0]?.score ?? 0).padStart(6, '0')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '3px', color: '#E94560' }}>
            {renderHearts(players[0]?.lives ?? 0)}
          </div>
          {players[0]?.hasPowerPellet && (
            <span style={{ color: '#FFEB3B', fontSize: '7px' }}>
              POWER {((players[0].powerPelletTimer || 0) / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {mode === 'coop' && players.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00D4AA', fontSize: '9px' }}>P2</span>
              <span style={{ color: PLAYER_COLORS[1] }}>
                {String(players[1]?.score ?? 0).padStart(6, '0')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px', color: '#E94560' }}>
              {renderHearts(players[1]?.lives ?? 0)}
            </div>
            {players[1]?.hasPowerPellet && (
              <span style={{ color: '#FFEB3B', fontSize: '7px' }}>
                POWER {((players[1].powerPelletTimer || 0) / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '8px',
          color: '#CCCCCC',
          minWidth: 0,
          flexShrink: 1,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span>
          LEVEL <span style={{ color: '#00FF00' }}>{level}</span>
        </span>
        <span>
          DOTS <span style={{ color: '#E94560' }}>{dotsRemaining}</span>
        </span>
        <span
          style={{
            padding: '3px 8px',
            border: `1px solid ${statusColor(gameStatus)}`,
            color: statusColor(gameStatus),
            fontSize: '7px',
          }}
        >
          {statusText(gameStatus)}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '7px',
          color: '#9D4EDD',
          textAlign: 'right',
          minWidth: 0,
        }}
      >
        <span>
          PELLET: {Math.max(0, Math.ceil(pelletTimer / 1000))}s
        </span>
      </div>
    </div>
  )
}

function renderHearts(lives: number): string[] {
  const result: string[] = []
  for (let i = 0; i < INITIAL_LIVES; i++) {
    result.push(i < lives ? HEART_FILLED : HEART_EMPTY)
  }
  return result
}

function statusText(status: string): string {
  switch (status) {
    case 'idle':
      return 'READY'
    case 'playing':
      return 'PLAYING'
    case 'paused':
      return 'PAUSED'
    case 'gameover':
      return 'GAME OVER'
    case 'win':
      return 'WIN!'
    default:
      return ''
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'idle':
      return '#FFEB3B'
    case 'playing':
      return '#00FF00'
    case 'paused':
      return '#FFB852'
    case 'gameover':
      return '#FF0000'
    case 'win':
      return '#00FFFF'
    default:
      return '#FFFFFF'
  }
}

export default HUD
