import React from 'react'
import { GameState } from '../game/GameEngine'

interface UIOverlayProps {
  gameState: GameState
  onRestart: () => void
  isMobile: boolean
  isSmallScreen: boolean
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, onRestart, isMobile, isSmallScreen }) => {
  const {
    score,
    speed,
    combo,
    lives,
    multiplier,
    highScore,
    isRunning,
    isGameOver,
    extraLives,
    showFrameDropWarning,
    speedBoostActive
  } = gameState

  const fontSize = isSmallScreen ? '16px' : '20px'
  const titleFontSize = isSmallScreen ? '36px' : '56px'
  const subTitleFontSize = isSmallScreen ? '20px' : '28px'

  const renderHearts = () => {
    const hearts = []
    for (let i = 0; i < 3; i++) {
      hearts.push(
        <span
          key={i}
          style={{
            fontSize: isSmallScreen ? '20px' : '26px',
            color: i < lives ? '#ff3366' : '#333',
            textShadow: i < lives ? '0 0 12px #ff3366, 0 0 20px #ff0066' : 'none',
            marginRight: '4px',
            display: 'inline-block'
          }}
        >
          ♥
        </span>
      )
    }
    return hearts
  }

  const renderExtraLives = () => {
    if (extraLives === 0) return null
    const orbs = []
    for (let i = 0; i < extraLives; i++) {
      orbs.push(
        <span
          key={`extra-${i}`}
          style={{
            display: 'inline-block',
            width: isSmallScreen ? '12px' : '16px',
            height: isSmallScreen ? '12px' : '16px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #66ffff, #0099ff, #0033aa)',
            boxShadow: '0 0 10px #00f0ff, 0 0 15px #0099ff',
            marginRight: '6px',
            border: '1px solid #00f0ff'
          }}
        />
      )
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
        <span
          style={{
            color: '#888',
            fontSize: isSmallScreen ? '12px' : '14px',
            marginRight: '8px',
            textShadow: 'none'
          }}
        >
          生命球:
        </span>
        {orbs}
      </div>
    )
  }

  if (!isRunning && !isGameOver) {
    return null
  }

  const hudStyle: React.CSSProperties = {
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#ffffff',
    textShadow: '0 0 10px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.5)',
    fontWeight: 'bold',
    letterSpacing: '1px'
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: isSmallScreen ? '12px' : '20px',
          left: isSmallScreen ? '18px' : '30px',
          textAlign: 'left',
          ...hudStyle
        }}
      >
        <div style={{ fontSize, marginBottom: '6px', color: '#ffffff' }}>
          得分: {score.toLocaleString()}
        </div>
        <div style={{ fontSize, marginBottom: '6px', color: '#aaddff' }}>
          速度: {speed.toFixed(1)}
        </div>
        <div style={{ fontSize, color: '#ffccff' }}>
          连击: {combo}
          {multiplier > 1 && (
            <span
              style={{
                color: '#ffff00',
                marginLeft: '10px',
                textShadow: '0 0 12px #ffff00, 0 0 20px #ffcc00',
                animation: 'pulse 0.5s ease infinite alternate'
              }}
            >
              ×{multiplier}
            </span>
          )}
        </div>
        {speedBoostActive && (
          <div
            style={{
              fontSize: isSmallScreen ? '14px' : '16px',
              color: '#00f0ff',
              textShadow: '0 0 12px #00f0ff, 0 0 20px #0099ff',
              marginTop: '8px',
              animation: 'pulse 0.3s ease infinite alternate'
            }}
          >
            ⚡ 加速中！⚡
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: isSmallScreen ? '12px' : '20px',
          right: isSmallScreen ? '18px' : '30px',
          textAlign: 'right',
          ...hudStyle
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize,
              marginRight: '10px',
              color: '#aaddff'
            }}
          >
            生命
          </span>
          <div style={{ display: 'flex', alignItems: 'center' }}>{renderHearts()}</div>
        </div>
        {renderExtraLives()}
      </div>

      {showFrameDropWarning && !isSmallScreen && (
        <div
          style={{
            position: 'absolute',
            top: isSmallScreen ? '50px' : '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 100, 0, 0.9)',
            padding: '8px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#fff',
            textShadow: 'none',
            fontWeight: 'bold',
            boxShadow: '0 0 15px rgba(255, 100, 0, 0.5)',
            animation: 'pulse 1s ease infinite alternate'
          }}
        >
          ⚠️ 帧率下降，已自动降低渲染质量
        </div>
      )}

      {isGameOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            style={{
              fontSize: titleFontSize,
              fontWeight: 'bold',
              textShadow: '0 0 20px #ff00aa, 0 0 40px #ff00aa, 0 0 60px rgba(255, 0, 170, 0.5)',
              marginBottom: '30px',
              color: '#ffffff',
              letterSpacing: '3px'
            }}
          >
            游戏结束
          </div>

          <div
            style={{
              fontSize: subTitleFontSize,
              marginBottom: '12px',
              color: '#ffffff',
              textShadow: '0 0 15px #00f0ff, 0 0 25px rgba(0, 240, 255, 0.5)'
            }}
          >
            最终得分: {score.toLocaleString()}
          </div>

          {score >= highScore && score > 0 ? (
            <div
              style={{
                fontSize: isSmallScreen ? '20px' : '24px',
                color: '#ffff00',
                textShadow: '0 0 15px #ffff00, 0 0 30px #ffcc00, 0 0 45px rgba(255, 255, 0, 0.5)',
                marginBottom: '35px',
                animation: 'pulse 0.8s ease infinite alternate',
                fontWeight: 'bold'
              }}
            >
              🎉 新纪录！恭喜你！ 🎉
            </div>
          ) : (
            <div
              style={{
                fontSize: isSmallScreen ? '16px' : '20px',
                color: '#aaaaaa',
                marginBottom: '35px',
                textShadow: 'none'
              }}
            >
              最高分: {highScore.toLocaleString()}
            </div>
          )}

          <button
            onClick={onRestart}
            style={{
              padding: isSmallScreen ? '12px 36px' : '16px 60px',
              fontSize: isSmallScreen ? '18px' : '22px',
              fontWeight: 'bold',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ff00aa, #00f0ff)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(255, 0, 170, 0.6), 0 0 25px rgba(0, 240, 255, 0.4)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
              letterSpacing: '2px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow =
                '0 0 35px rgba(255, 0, 170, 0.8), 0 0 35px rgba(0, 240, 255, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow =
                '0 0 25px rgba(255, 0, 170, 0.6), 0 0 25px rgba(0, 240, 255, 0.4)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            再来一次
          </button>

          <div
            style={{
              marginTop: '25px',
              fontSize: '14px',
              color: '#666',
              textShadow: 'none'
            }}
          >
            或按空格键重新开始
          </div>
        </div>
      )}

      {isMobile && isRunning && !isGameOver && (
        <div
          style={{
            position: 'absolute',
            bottom: isSmallScreen ? '5px' : '12px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 20px',
            opacity: 0.4
          }}
        >
          <div style={{ color: '#00f0ff', fontSize: isSmallScreen ? '12px' : '14px' }}>
            ← 跳跃
          </div>
          <div style={{ color: '#ff00aa', fontSize: isSmallScreen ? '12px' : '14px' }}>
            二段跳 →
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          from {
            opacity: 0.7;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  )
}
