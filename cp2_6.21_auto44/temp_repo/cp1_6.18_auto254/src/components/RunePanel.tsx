import React from 'react'
import { RuneType } from '../types'
import { RUNE_DATA } from '../Rune'

interface RunePanelProps {
  onRuneDragStart: (type: RuneType) => void
  onRuneDragEnd: () => void
}

const RunePanel: React.FC<RunePanelProps> = ({ onRuneDragStart, onRuneDragEnd }) => {
  const runeTypes = Object.values(RuneType)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: RuneType) => {
    e.dataTransfer.setData('runeType', type)
    e.dataTransfer.effectAllowed = 'copy'
    onRuneDragStart(type)
  }

  const handleDragEnd = () => {
    onRuneDragEnd()
  }

  const renderSymbol = (type: RuneType): React.ReactNode => {
    const size = 40
    const color = '#fff'

    switch (type) {
      case RuneType.FIRE:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <polygon points="20,5 35,32 5,32" fill={color} opacity="0.9" />
          </svg>
        )
      case RuneType.ICE:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <polygon points="20,5 35,20 20,35 5,20" fill={color} opacity="0.9" />
          </svg>
        )
      case RuneType.THUNDER:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <polygon points="22,5 28,18 20,18 26,35 14,20 20,20 14,5" fill={color} opacity="0.9" />
          </svg>
        )
      case RuneType.EARTH:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <rect x="6" y="6" width="28" height="28" fill={color} opacity="0.9" />
          </svg>
        )
      case RuneType.WIND:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <path
              d="M20 8 Q30 8 30 18 Q30 28 20 28 Q12 28 12 20"
              stroke={color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M15 14 Q25 14 25 22"
              stroke={color}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>
        )
      case RuneType.SHADOW:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="13" stroke={color} strokeWidth="4" fill="none" opacity="0.9" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div
      className="rune-panel"
      style={{
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '140px',
        padding: '20px 10px',
        background: 'rgba(30, 30, 30, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px 0 0 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 10
      }}
    >
      <h3
        style={{
          color: '#FFB300',
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '8px',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}
      >
        魔法符文
      </h3>
      {runeTypes.map((type) => {
        const rune = RUNE_DATA[type]
        return (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'grab',
              transition: 'all 0.2s ease',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${rune.color}40`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateX(-4px)'
              e.currentTarget.style.boxShadow = `0 0 15px ${rune.color}40`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.transform = 'translateX(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${rune.color}90, ${rune.color}50)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 10px ${rune.color}60`,
                flexShrink: 0
              }}
            >
              {renderSymbol(type)}
            </div>
            <span
              style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              {rune.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default RunePanel
