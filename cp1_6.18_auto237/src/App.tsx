import React, { useEffect, useState } from 'react'
import { Board } from './Board'
import { useGameStore, PLAYER_COLORS, PLAYER_HIGHLIGHTS } from './gameStore'
import type { PlayerId } from './gameStore'

const BG_START = '#0A0A23'
const BG_END = '#12123A'

function PlayerAvatar({
  player,
  active,
}: {
  player: PlayerId
  active: boolean
}) {
  const color = PLAYER_COLORS[player]
  const highlight = PLAYER_HIGHLIGHTS[player]
  const size = 60

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        padding: '3px',
        background: active
          ? `conic-gradient(from 0deg, ${color}, ${highlight}, ${color})`
          : 'rgba(255,255,255,0.1)',
        boxShadow: active
          ? `0 0 24px ${color}aa, inset 0 0 12px rgba(255,255,255,0.2)`
          : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${highlight}, ${color} 60%, ${color}88 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          fontFamily: 'Georgia, serif',
        }}
      >
        {player === 1 ? '★' : '✦'}
      </div>
      {active && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            opacity: 0.5,
            animation: 'pulse-ring 1.6s ease-out infinite',
          }}
        />
      )}
    </div>
  )
}

function StatBlock({
  player,
  count,
  active,
}: {
  player: PlayerId
  count: number
  active: boolean
}) {
  const color = PLAYER_COLORS[player]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 20px',
        borderRadius: 12,
        background: active
          ? `linear-gradient(135deg, ${color}22, ${color}08)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${
          active ? `${color}55` : 'rgba(255,255,255,0.06)'
        }`,
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${PLAYER_HIGHLIGHTS[player]}, ${color})`,
          boxShadow: `0 0 12px ${color}88`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
            marginBottom: 4,
            letterSpacing: 1,
          }}
        >
          玩家 {player}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            letterSpacing: 1,
            textShadow: '0 0 20px rgba(255,255,255,0.3)',
          }}
        >
          {count}
        </div>
      </div>
    </div>
  )
}

function App() {
  const currentPlayer = useGameStore(s => s.currentPlayer)
  const pieceCount = useGameStore(s => s.pieceCount)
  const gameOver = useGameStore(s => s.gameOver)
  const resetGame = useGameStore(s => s.resetGame)

  const [cellSize, setCellSize] = useState(72)

  useEffect(() => {
    const calc = () => {
      const vh = window.innerHeight
      const vw = window.innerWidth
      const maxByHeight = Math.floor((vh - 160) / 8)
      const maxByWidth = Math.floor((vw - 480) / 8)
      const size = Math.max(56, Math.min(88, Math.min(maxByHeight, maxByWidth)))
      setCellSize(size)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  const activePlayer: PlayerId = gameOver
    ? pieceCount[1] >= pieceCount[2]
      ? 1
      : 2
    : currentPlayer

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at 30% 20%, ${BG_END}, ${BG_START} 70%, #050515 100%)`,
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
      }}
    >
      <StarField />

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 64,
          padding: 40,
        }}
      >
        <div style={{ animation: 'float 6s ease-in-out infinite' }}>
          <Board cellSize={cellSize} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            width: 300,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: 4,
                marginBottom: 16,
                textTransform: 'uppercase',
              }}
            >
              Star Orbit Chess
            </div>
            <h1
              style={{
                fontSize: 40,
                fontWeight: 900,
                background: `linear-gradient(135deg, #FFD700, #FF4500 50%, #00BFFF)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: 4,
                marginBottom: 8,
              }}
            >
              星轨棋
            </h1>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: 28,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: 2,
              }}
            >
              {gameOver ? '游戏结束' : '当前回合'}
            </div>
            <PlayerAvatar player={activePlayer} active={true} />
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: PLAYER_COLORS[activePlayer],
                textShadow: `0 0 20px ${PLAYER_COLORS[activePlayer]}88`,
                letterSpacing: 2,
              }}
            >
              {gameOver
                ? pieceCount[1] === pieceCount[2]
                  ? '平局'
                  : `玩家 ${activePlayer} 胜利！`
                : `玩家 ${currentPlayer} 落子`}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StatBlock
              player={1}
              count={pieceCount[1]}
              active={!gameOver && currentPlayer === 1}
            />
            <StatBlock
              player={2}
              count={pieceCount[2]}
              active={!gameOver && currentPlayer === 2}
            />
          </div>

          <button
            onClick={resetGame}
            style={{
              padding: '16px 32px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #4FC3F7, #29B6F6)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(79, 195, 247, 0.4)',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background =
                'linear-gradient(135deg, #81D4FA, #4FC3F7)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow =
                '0 8px 28px rgba(79, 195, 247, 0.55)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background =
                'linear-gradient(135deg, #4FC3F7, #29B6F6)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow =
                '0 4px 20px rgba(79, 195, 247, 0.4)'
            }}
            onMouseDown={e => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            重新开始
          </button>

          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.35)',
              lineHeight: 1.8,
              padding: '16px 20px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ marginBottom: 6, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
              游戏规则
            </div>
            点击空格放置棋子。相邻的对方棋子会被引力吞噬！棋盘填满时棋子多者获胜。
          </div>
        </div>
      </div>
    </div>
  )
}

function StarField() {
  const stars = React.useMemo(() => {
    const list: { x: number; y: number; size: number; delay: number; duration: number }[] = []
    for (let i = 0; i < 150; i++) {
      list.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 4,
      })
    }
    return list
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 ${s.size * 4}px rgba(255,255,255,0.8)`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default App
