import React from 'react'
import { GameState } from '../game/GameEngine'

interface UIOverlayProps {
  gameState: GameState
  onRestart: () => void
  isMobile: boolean
  isSmallScreen: boolean
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, onRestart, isMobile, isSmallScreen }) => {
  const { score, speed, combo, lives, multiplier, highScore, isRunning, isGameOver, extraLives, showFrameDropWarning, speedBoostActive } = gameState

  const fontSize = isSmallScreen ? '16px' : '20px'
  const titleFontSize = isSmallScreen ? '36px' : '56px'

  const renderHearts = () => {
    const hearts = []
    for (let i = 0; i < 3; i++) {
      hearts.push(
        <span
          key={i}
          style={{
            fontSize: isSmallScreen ? '20px' : '24px',
            color: i < lives ? '#ff0066' : '#333',
            textShadow: i < lives ? '0 0 10px #ff0066' : 'none',
            marginRight: '4px'
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
            width: isSmallScreen ? '12px' : '14px',
            height: isSmallScreen ? '12px' : '14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00f0ff, #0066ff)',
            boxShadow: '0 0 8px #00f0ff',
            marginRight: '4px'
          }}
        />
      )
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
        <span style={{ color: '#888', fontSize: isSmallScreen ? '12px' : '14px', marginRight: '6px' }}>
          生命球:
        </span>
        {orbs}
      </div>
    )
  }

  if (!isRunning && !isGameOver) {
    return null
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
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        padding: isSmallScreen ? '10px' : '20px'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: isSmallScreen ? '15px' : '25px',
          left: isSmallScreen ? '20px' : '35px',
          textAlign: 'left'
        }}
      >
        <div
          style={{
            fontSize,
            textShadow: '0 0 10px #00f0ff',
            marginBottom: '4px',
            fontWeight: 'bold'
          }}
        >
          得分: {score.toLocaleString()}
        </div>
        <div
          style={{
            fontSize,
            textShadow: '0 0 10px #00f0ff',
            marginBottom: '4px'
          }}
        >
          速度: {speed.toFixed(1)} px/帧
        </div>
        <div
          style={{
            fontSize,
            textShadow: '0 0 10px #00f0ff'
          }}
        >
          连击: {combo}
          {multiplier > 1 && (
            <span style={{ color: '#ffff00', marginLeft: '8px', textShadow: '0 0 10px #ffff00' }}>
              x{multiplier}
            </span>
          )}
        </div>
        {speedBoostActive && (
          <div
            style={{
              fontSize: isSmallScreen ? '14px' : '16px',
              color: '#00f0ff',
              textShadow: '0 0 10px #00f0ff',
              marginTop: '4px',
              animation: 'pulse 0.5s infinite alternate'
            }}
          >
            ⚡ 加速中！
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: isSmallScreen ? '15px' : '25px',
          right: isSmallScreen ? '20px' : '35px',
          textAlign: 'right'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize,
              textShadow: '0 0 10px #00f0ff',
              marginRight: '8px'
            }}
          >
            生命:
          </span>
          <div>{renderHearts()}</div>
        </div>
        {renderExtraLives()}
      </div>

      {showFrameDropWarning && !isSmallScreen && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 100, 0, 0.8)',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#fff',
            textShadow: 'none'
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}
        >
          <div
            style={{
              fontSize: titleFontSize,
              fontWeight: 'bold',
              textShadow: '0 0 20px #ff00aa',
              marginBottom: '20px',
              color: '#fff',
              stroke: '#ff00aa',
              paintOrder: 'stroke'
            }}
          >
            游戏结束
          </div>

          <div
            style={{
              fontSize: isSmallScreen ? '22px' : '28px',
              marginBottom: '10px',
              color: '#fff',
              textShadow: '0 0 10px #00f0ff'
            }}
          >
            最终得分: {score.toLocaleString()}
          </div>

          {score >= highScore && score > 0 ? (
            <div
              style={{
                fontSize: isSmallScreen ? '18px' : '22px',
                color: '#ffff00',
                textShadow: '0 0 15px #ffff00',
                marginBottom: '30px',
                animation: 'pulse 1s infinite alternate'
              }}
            >
              🎉 新纪录！
            </div>
          ) : (
            <div
              style={{
                fontSize: isSmallScreen ? '16px' : '20px',
                color: '#aaa',
                marginBottom: '30px'
              }}
            >
              最高分: {highScore.toLocaleString()}
            </div>
          )}

          <button
            onClick={onRestart}
            style={{
              padding: isSmallScreen ? '12px 30px' : '15px 50px',
              fontSize: isSmallScreen ? '18px' : '22px',
              fontWeight: 'bold',
              color: '#fff',
              background: 'linear-gradient(135deg, #ff00aa, #00f0ff)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255, 0, 170, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 0, 170, 0.7), 0 0 30px rgba(0, 240, 255, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 0, 170, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
          >
            再来一次
          </button>
        </div>
      )}

      {isMobile && isRunning && !isGameOver && (
        <div
          style={{
            position: 'absolute',
            bottom: isSmallScreen ? '5px' : '10px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 20px',
            opacity: 0.5
          }}
        >
          <div style={{ color: '#00f0ff', fontSize: '14px' }}>← 点击跳跃</div>
          <div style={{ color: '#ff00aa', fontSize: '14px' }}>点击二段跳 →</div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
