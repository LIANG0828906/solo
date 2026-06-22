import React from 'react'
import type { GameState } from './GameEngine'

interface HUDProps {
  gameState: GameState
  onRestart: () => void
}

const HUD: React.FC<HUDProps> = ({ gameState, onRestart }) => {
  const energyPercent = (gameState.energy / gameState.maxEnergy) * 100

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(30, 41, 59, 0.67)',
          borderRadius: 8,
          padding: '12px 16px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: '#FFFFFF',
          textShadow: '0 0 10px rgba(51, 204, 255, 0.8)',
          fontSize: 18,
          lineHeight: 1.6,
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)'
        }}
      >
        <div>速度: {Math.floor(gameState.speed)}</div>
        <div>分数: {gameState.score}</div>
        {gameState.isSpeedBurst && (
          <div style={{ color: '#00FF88', textShadow: '0 0 10px #00FF88' }}>
            ⚡ 爆发模式!
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#FFFFFF',
            textShadow: '0 0 10px rgba(255, 204, 0, 0.8)',
            fontSize: 14
          }}
        >
          能量
        </div>
        <div
          style={{
            width: 200,
            height: 12,
            background: '#334155',
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #FFCC00, #FFD700)',
              borderRadius: 6,
              width: `${energyPercent}%`,
              transition: 'width 0.2s ease-out',
              boxShadow: '0 0 10px #FFCC00'
            }}
          />
        </div>
      </div>

      {gameState.isGameOver && (
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
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10
          }}
        >
          <h1
            style={{
              fontFamily: 'monospace',
              fontSize: 48,
              fontWeight: 'bold',
              color: '#FF3366',
              textShadow: '0 0 20px #FF3366, 0 0 40px #FF3366',
              marginBottom: 24,
              letterSpacing: 4
            }}
          >
            GAME OVER
          </h1>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 24,
              color: '#FFFFFF',
              textShadow: '0 0 10px rgba(51, 204, 255, 0.8)',
              marginBottom: 12
            }}
          >
            得分: {gameState.score}
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 18,
              color: '#FFCC00',
              textShadow: '0 0 10px rgba(255, 204, 0, 0.8)',
              marginBottom: 40
            }}
          >
            最高分: {gameState.highScore}
          </div>
          <button
            onClick={onRestart}
            style={{
              fontFamily: 'monospace',
              fontSize: 20,
              fontWeight: 'bold',
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #33CCFF, #00FF88)',
              border: 'none',
              borderRadius: 8,
              padding: '14px 40px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(51, 204, 255, 0.6)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              letterSpacing: 2
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(51, 204, 255, 0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(51, 204, 255, 0.6)'
            }}
          >
            重新开始
          </button>
        </div>
      )}
    </>
  )
}

export default HUD
