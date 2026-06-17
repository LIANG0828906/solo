import React, { useEffect, useRef, useState } from 'react'
import { RunePanel } from './components/RunePanel'
import { MonsterCard } from './components/MonsterCard'
import { BattleUI } from './components/BattleUI'
import { useGameStore } from './store/gameStore'

const App: React.FC = () => {
  const { gamePhase, startGame, resetBattle, isVictoryAnimation, isDefeatAnimation, monsterAttack, startNewTurn } =
    useGameStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [showVictoryIcon, setShowVictoryIcon] = useState(false)

  useEffect(() => {
    if (isVictoryAnimation) {
      setShowVictoryIcon(true)
      const timer = setTimeout(() => {
        setShowVictoryIcon(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isVictoryAnimation])

  const handleStart = () => {
    startGame()
  }

  const handleRestart = () => {
    resetBattle()
    setShowVictoryIcon(false)
  }

  const handleNextTurn = () => {
    startNewTurn()
  }

  const isLowHealth = useGameStore((state) => state.playerHealth / state.playerMaxHealth < 0.3)

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0B0E27',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px 20px 40px 20px',
      }}
    >
      <BattleUI />

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          backgroundColor: 'rgba(26, 26, 46, 0.6)',
          boxShadow: '0 0 200px rgba(78, 205, 196, 0.15)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          marginTop: '20px',
        }}
      >
        <MonsterCard />
      </div>

      {gamePhase === 'player_turn' && (
        <div
          style={{
            position: 'absolute',
            top: '160px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#00E5FF',
            fontSize: '16px',
            fontFamily: 'monospace',
            textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
            zIndex: 10,
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          — 你的回合 —
        </div>
      )}

      {gamePhase === 'monster_attack' && (
        <div
          style={{
            position: 'absolute',
            top: '160px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#FF6B6B',
            fontSize: '16px',
            fontFamily: 'monospace',
            textShadow: '0 0 10px rgba(255, 107, 107, 0.5)',
            zIndex: 10,
          }}
        >
          — 怪物攻击中 —
        </div>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          marginBottom: '20px',
        }}
      >
        <RunePanel />
      </div>

      {gamePhase === 'idle' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(11, 14, 39, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <h1
            style={{
              color: '#00E5FF',
              fontSize: '48px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textShadow: '0 0 30px rgba(0, 229, 255, 0.5)',
              marginBottom: '20px',
            }}
          >
            符文之战
          </h1>
          <p
            style={{
              color: '#8888AA',
              fontSize: '16px',
              fontFamily: 'monospace',
              marginBottom: '40px',
              textAlign: 'center',
              maxWidth: '400px',
              lineHeight: '1.6',
            }}
          >
            组合不同元素的符文，释放强大法术
            <br />
            击败暗影魔狼，证明你的实力！
          </p>
          <button
            onClick={handleStart}
            style={{
              width: '160px',
              height: '50px',
              borderRadius: '12px',
              backgroundColor: '#1A1A2E',
              border: '1px solid #00E5FF',
              color: '#00E5FF',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease-out',
              fontFamily: 'monospace',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00E5FF'
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A1A2E'
              e.currentTarget.style.color = '#00E5FF'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            开始战斗
          </button>
        </div>
      )}

      {showVictoryIcon && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 300,
            pointerEvents: 'none',
          }}
        >
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            style={{
              animation: 'victory-spread 1s ease-out forwards',
            }}
          >
            <path
              d="M 60 100 Q 80 50 100 80 Q 120 50 140 100"
              stroke="#6BCB77"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 50 110 Q 80 40 100 70 Q 120 40 150 110"
              stroke="#6BCB77"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>
        </div>
      )}

      {gamePhase === 'victory' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            backgroundColor: 'rgba(11, 14, 39, 0.8)',
            animation: 'defeat-fade 0.5s ease-out',
          }}
        >
          <h1
            style={{
              color: '#6BCB77',
              fontSize: '56px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textShadow: '0 0 30px rgba(107, 203, 119, 0.5)',
              marginBottom: '20px',
            }}
          >
            胜 利
          </h1>
          <p
            style={{
              color: '#FFFFFF',
              fontSize: '18px',
              fontFamily: 'monospace',
              marginBottom: '40px',
            }}
          >
            你成功击败了暗影魔狼！
          </p>
          <button
            onClick={handleRestart}
            style={{
              width: '160px',
              height: '50px',
              borderRadius: '12px',
              backgroundColor: '#1A1A2E',
              border: '1px solid #6BCB77',
              color: '#6BCB77',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease-out',
              fontFamily: 'monospace',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6BCB77'
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(107, 203, 119, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A1A2E'
              e.currentTarget.style.color = '#6BCB77'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            再来一局
          </button>
        </div>
      )}

      {gamePhase === 'defeat' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'defeat-fade 1.5s ease-out',
          }}
        >
          <h1
            style={{
              color: '#FF6B6B',
              fontSize: '56px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textShadow: '0 0 30px rgba(255, 107, 107, 0.5)',
              marginBottom: '20px',
            }}
          >
            败 北
          </h1>
          <p
            style={{
              color: '#8888AA',
              fontSize: '18px',
              fontFamily: 'monospace',
              marginBottom: '40px',
            }}
          >
            你被暗影魔狼击败了...
          </p>
          <button
            onClick={handleRestart}
            style={{
              width: '160px',
              height: '50px',
              borderRadius: '12px',
              backgroundColor: '#1A1A2E',
              border: '1px solid #FF6B6B',
              color: '#FF6B6B',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease-out',
              fontFamily: 'monospace',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6B6B'
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 107, 107, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A1A2E'
              e.currentTarget.style.color = '#FF6B6B'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            重新挑战
          </button>
        </div>
      )}

      {gamePhase === 'player_turn' && (
        <button
          onClick={handleNextTurn}
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            width: '120px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#1A1A2E',
            border: '1px solid #00E5FF',
            color: '#00E5FF',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease-out',
            fontFamily: 'monospace',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00E5FF'
            e.currentTarget.style.color = '#FFFFFF'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1A1A2E'
            e.currentTarget.style.color = '#00E5FF'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          下一回合
        </button>
      )}
    </div>
  )
}

export default App
