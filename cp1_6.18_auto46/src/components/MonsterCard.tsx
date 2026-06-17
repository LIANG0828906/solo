import React, { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export const MonsterCard: React.FC = () => {
  const {
    monsterName,
    monsterHealth,
    monsterMaxHealth,
    isMonsterHurt,
    isMonsterAttacking,
    monsterStatusEffects,
  } = useGameStore()

  const cardRef = useRef<HTMLDivElement>(null)

  const healthPercent = (monsterHealth / monsterMaxHealth) * 100

  const hasBurn = monsterStatusEffects.some((e) => e.type === 'burn')
  const hasFreeze = monsterStatusEffects.some((e) => e.type === 'freeze')

  return (
    <div
      ref={cardRef}
      style={{
        width: '240px',
        height: '300px',
        backgroundColor: '#2A1B3D',
        borderRadius: '16px',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        boxShadow: '0 0 30px rgba(0, 229, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        position: 'relative',
        transition: 'transform 0.3s ease-out',
        animation: isMonsterHurt ? 'knockback 0.6s ease-out' : 'none',
      }}
    >
      {isMonsterAttacking && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 107, 107, 0.3)',
            animation: 'flash-red 0.3s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      <h3
        style={{
          color: '#FFFFFF',
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '16px',
          textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
          fontFamily: 'monospace',
        }}
      >
        {monsterName}
      </h3>

      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '12px',
          backgroundColor: '#1A1A2E',
          border: '1px solid #3A3A5C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: '80px',
            filter: hasFreeze ? 'hue-rotate(180deg) brightness(1.2)' : 'none',
            transition: 'filter 0.3s ease-out',
          }}
        >
          🐺
        </span>
        {hasBurn && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: '#FF6B6B',
              opacity: 0.6,
              animation: 'pulse-glow 1s ease-in-out infinite',
            }}
          />
        )}
        {hasFreeze && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              fontSize: '24px',
            }}
          >
            ❄️
          </div>
        )}
      </div>

      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ color: '#FF6B6B', fontSize: '12px' }}>HP</span>
          <span style={{ color: '#FFFFFF', fontSize: '12px' }}>
            {monsterHealth}/{monsterMaxHealth}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#1A1A2E',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #3A3A5C',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(to right, #FF6B6B, #C0392B)',
              width: `${healthPercent}%`,
              transition: 'width 0.3s ease-out',
              borderRadius: '6px',
            }}
          />
        </div>
      </div>

      {monsterStatusEffects.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            gap: '4px',
          }}
        >
          {monsterStatusEffects.map((effect) => (
            <div
              key={effect.id}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                backgroundColor: effect.type === 'burn' ? '#FF6B6B40' : '#4ECDC440',
                border: `1px solid ${effect.type === 'burn' ? '#FF6B6B' : '#4ECDC4'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#FFFFFF',
                fontFamily: 'monospace',
              }}
            >
              {effect.duration}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
