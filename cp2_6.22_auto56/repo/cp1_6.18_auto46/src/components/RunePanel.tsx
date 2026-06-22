import React from 'react'
import { useGameStore, Rune, RuneType } from '../store/gameStore'

const RUNE_COLORS: Record<RuneType, string> = {
  fire: '#FF6B6B',
  ice: '#4ECDC4',
  thunder: '#FFD93D',
  wind: '#6BCB77',
}

const RUNE_SYMBOLS: Record<RuneType, string> = {
  fire: '🔥',
  ice: '❄',
  thunder: '⚡',
  wind: '🌪',
}

interface RuneButtonProps {
  rune: Rune
  isSelected: boolean
  onClick: () => void
}

const RuneButton: React.FC<RuneButtonProps> = ({ rune, isSelected, onClick }) => {
  const color = RUNE_COLORS[rune.type]

  return (
    <div
      onClick={onClick}
      style={{
        width: '60px',
        height: '60px',
        backgroundColor: '#1E1E2E',
        borderRadius: '8px',
        border: `1px solid ${isSelected ? color : '#3A3A5C'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s ease-out',
        boxShadow: isSelected
          ? `0 0 20px ${color}80, 0 0 40px ${color}40`
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#00E5FF66'
          e.currentTarget.style.boxShadow = '0 0 10px #00E5FF40'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#3A3A5C'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            borderRadius: '8px',
            backgroundColor: color,
            opacity: 0.3,
            animation: 'pulse-glow 0.5s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
      <span
        style={{
          fontSize: '28px',
          position: 'relative',
          zIndex: 1,
          filter: isSelected ? `drop-shadow(0 0 8px ${color})` : 'none',
        }}
      >
        {RUNE_SYMBOLS[rune.type]}
      </span>
    </div>
  )
}

export const RunePanel: React.FC = () => {
  const { runeGrid, selectedRunes, selectRune, deselectRune, castSpell, gamePhase, playerMana } =
    useGameStore()

  const handleRuneClick = (rune: Rune) => {
    if (gamePhase !== 'player_turn') return

    if (selectedRunes.some((r) => r.id === rune.id)) {
      deselectRune(rune.id)
    } else {
      selectRune(rune)
    }
  }

  const canCast = selectedRunes.length > 0 && playerMana >= 10 && gamePhase === 'player_turn'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 60px)',
          gridTemplateRows: 'repeat(3, 60px)',
          gap: '10px',
          padding: '16px',
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 229, 255, 0.4)',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)',
        }}
      >
        {runeGrid.map((rune) => (
          <RuneButton
            key={rune.id}
            rune={rune}
            isSelected={selectedRunes.some((r) => r.id === rune.id)}
            onClick={() => handleRuneClick(rune)}
          />
        ))}
      </div>

      <button
        onClick={castSpell}
        disabled={!canCast}
        style={{
          width: '120px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: canCast ? '#1A1A2E' : '#1A1A2E66',
          border: `1px solid ${canCast ? '#00E5FF' : '#00E5FF40'}`,
          color: canCast ? '#00E5FF' : '#00E5FF40',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: canCast ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease-out',
          fontFamily: 'monospace',
        }}
        onMouseEnter={(e) => {
          if (canCast) {
            e.currentTarget.style.backgroundColor = '#00E5FF'
            e.currentTarget.style.color = '#FFFFFF'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.5)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = canCast ? '#1A1A2E' : '#1A1A2E66'
          e.currentTarget.style.color = canCast ? '#00E5FF' : '#00E5FF40'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        施法
      </button>
    </div>
  )
}
