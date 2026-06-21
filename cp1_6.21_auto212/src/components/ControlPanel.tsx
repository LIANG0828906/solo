import { useState } from 'react'
import type { DayNightMode, WeatherType } from '../types'

interface ControlPanelProps {
  dayNightMode: DayNightMode
  weather: WeatherType
  onDayNightChange: (mode: DayNightMode) => void
  onWeatherChange: (type: WeatherType) => void
  onRandomRegenerate: () => void
}

const SunIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const SunsetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10a2 2 0 0 0-2 2" />
    <path d="M12 2v2" />
    <path d="m4.93 10.93 1.41 1.41" />
    <path d="M2 18h2" />
    <path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" />
    <path d="M22 22H2" />
    <path d="m16 6-4 4-4-4" />
  </svg>
)

const SunnyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const RainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="13" x2="16" y2="21" />
    <line x1="8" y1="13" x2="8" y2="21" />
    <line x1="12" y1="15" x2="12" y2="23" />
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 3 15.28" />
  </svg>
)

const SnowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
  </svg>
)

const ShuffleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
)

function ControlPanel({
  dayNightMode,
  weather,
  onDayNightChange,
  onWeatherChange,
  onRandomRegenerate,
}: ControlPanelProps) {
  const [pressedButton, setPressedButton] = useState<string | null>(null)

  const dayNightOptions: { mode: DayNightMode; color: string; icon: React.ReactNode; label: string }[] = [
    { mode: 'day', color: '#FBBF24', icon: <SunIcon />, label: '白天' },
    { mode: 'night', color: '#6366F1', icon: <MoonIcon />, label: '夜晚' },
    { mode: 'dusk', color: '#F97316', icon: <SunsetIcon />, label: '黄昏' },
  ]

  const weatherOptions: { type: WeatherType; color: string; icon: React.ReactNode; label: string }[] = [
    { type: 'sunny', color: '#10B981', icon: <SunnyIcon />, label: '晴天' },
    { type: 'rain', color: '#3B82F6', icon: <RainIcon />, label: '雨天' },
    { type: 'snow', color: '#FFFFFF', icon: <SnowIcon />, label: '雪天' },
  ]

  const handleButtonPress = (id: string) => {
    setPressedButton(id)
    setTimeout(() => setPressedButton(null), 150)
  }

  const buttonStyle = (color: string, isSelected: boolean, id: string): React.CSSProperties => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color,
    color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
    boxShadow: isSelected ? `0 0 12px ${color}, 0 0 2px 2px ${color}40` : 'none',
    transform: pressedButton === id ? 'scale(0.9)' : 'scale(1)',
    transition: 'all 0.2s ease-out',
    filter: isSelected ? 'none' : 'brightness(0.85)',
  })

  const isWeatherButtonStyle = (color: string, isSelected: boolean, id: string): React.CSSProperties => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: isSelected ? `2px solid ${color}` : '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isSelected ? color : 'rgba(255,255,255,0.1)',
    color: isSelected ? (color === '#FFFFFF' ? '#1E293B' : '#FFFFFF') : 'rgba(255,255,255,0.6)',
    transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.2s ease',
    transform: pressedButton === id ? 'scale(0.9)' : 'scale(1)',
  })

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #475569',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div>
        <div style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>
          昼夜模式
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {dayNightOptions.map((option) => (
            <button
              key={option.mode}
              style={buttonStyle(option.color, dayNightMode === option.mode, `dn-${option.mode}`)}
              onClick={() => {
                handleButtonPress(`dn-${option.mode}`)
                onDayNightChange(option.mode)
              }}
              title={option.label}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>
          天气效果
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {weatherOptions.map((option) => (
            <button
              key={option.type}
              style={isWeatherButtonStyle(option.color, weather === option.type, `wt-${option.type}`)}
              onClick={() => {
                handleButtonPress(`wt-${option.type}`)
                onWeatherChange(option.type)
              }}
              title={option.label}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>

      <button
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#6366F1',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'filter 0.2s ease-out, transform 0.15s ease-out',
          transform: pressedButton === 'regen' ? 'scale(0.97)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onClick={() => {
          handleButtonPress('regen')
          onRandomRegenerate()
        }}
      >
        <ShuffleIcon />
        随机生成建筑
      </button>
    </div>
  )
}

export default ControlPanel
