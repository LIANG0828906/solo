import React from 'react'
import { useGameStore } from '../store/gameStore'

export const BattleUI: React.FC = () => {
  const {
    playerHealth,
    playerMaxHealth,
    playerMana,
    playerMaxMana,
    combo,
    gamePhase,
    countdownNumber,
    floatingNumbers,
  } = useGameStore()

  const healthPercent = (playerHealth / playerMaxHealth) * 100
  const manaPercent = (playerMana / playerMaxMana) * 100
  const isLowHealth = healthPercent < 30

  return (
    <>
      {isLowHealth && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '6px solid #FF6B6B',
            pointerEvents: 'none',
            zIndex: 100,
            animation: 'low-health-border 1s ease-in-out infinite',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ color: '#FF6B6B', fontSize: '14px' }}>❤️ 生命</span>
              <span style={{ color: '#FFFFFF', fontSize: '14px' }}>
                {playerHealth}/{playerMaxHealth}
              </span>
            </div>
            <div
              style={{
                width: '300px',
                height: '20px',
                backgroundColor: '#1A1A2E',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.1)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(to right, #FF6B6B, #C0392B)',
                  width: `${healthPercent}%`,
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ color: '#4ECDC4', fontSize: '14px' }}>💎 法力</span>
              <span style={{ color: '#FFFFFF', fontSize: '14px' }}>
                {playerMana}/{playerMaxMana}
              </span>
            </div>
            <div
              style={{
                width: '200px',
                height: '20px',
                backgroundColor: '#1A1A2E',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.1)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(to right, #4ECDC4, #1ABC9C)',
                  width: `${manaPercent}%`,
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
          </div>
        </div>

        {combo > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: combo > 5 ? 'combo-pulse 0.5s ease-in-out infinite' : 'none',
            }}
          >
            <span
              style={{
                color: '#FFD93D',
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                textShadow: '0 0 10px rgba(255, 217, 61, 0.5)',
              }}
            >
              {combo} 连击
            </span>
            <span style={{ color: '#FFD93D80', fontSize: '12px', fontFamily: 'monospace' }}>
              元素共鸣
            </span>
          </div>
        )}
      </div>

      {gamePhase === 'countdown' && countdownNumber > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
          }}
        >
          <span
            key={countdownNumber}
            style={{
              color: '#FFFFFF',
              fontSize: '48px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textShadow: '0 0 20px rgba(0, 229, 255, 0.8)',
              animation: 'countdown-scale 1s ease-out forwards',
              display: 'inline-block',
            }}
          >
            {countdownNumber}
          </span>
        </div>
      )}

      {floatingNumbers.map((num) => (
        <div
          key={num.id}
          style={{
            position: 'fixed',
            left: `${num.x}px`,
            top: `${num.y}px`,
            color: num.type === 'damage' ? '#FFFFFF' : '#6BCB77',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textShadow:
              num.type === 'damage'
                ? '0 0 10px rgba(255, 255, 255, 0.5)'
                : '0 0 10px rgba(107, 203, 119, 0.5)',
            animation: 'float-damage 1s ease-out forwards',
            zIndex: 60,
            pointerEvents: 'none',
          }}
        >
          {num.type === 'damage' ? '-' : '+'}
          {num.value}
        </div>
      ))}
    </>
  )
}
