import { useState, useCallback, useRef } from 'react'
import { useAppStore, formatTime, SEASON_LABELS, type Season } from '../store/appStore'

const SEASON_COLORS: Record<Season, string> = {
  spring: '#4CAF50',
  summer: '#2196F3',
  autumn: '#FF9800',
  winter: '#E0E0E0'
}

interface SeasonButtonProps {
  season: Season
  isActive: boolean
  onClick: () => void
}

function SeasonButton({ season, isActive, onClick }: SeasonButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const color = SEASON_COLORS[season]
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)
  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsPressed(false)
    setIsHovered(false)
  }

  const scale = isPressed ? 0.95 : isHovered ? 1.05 : 1

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        padding: '8px 16px',
        border: isActive ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        background: isActive ? `${color}33` : 'rgba(255,255,255,0.05)',
        color: '#E0E0E0',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.2s ease-out',
        transform: `scale(${scale})`,
        outline: 'none',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      {SEASON_LABELS[season]}
    </button>
  )
}

export default function TimeControl() {
  const { time, season, setTime, setSeason, showHeatmap, toggleHeatmap } = useAppStore()

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      setTime(value)
    },
    [setTime]
  )

  const min = 6
  const max = 18
  const step = 0.25
  const progress = (time - min) / (max - min)
  const percentage = progress * 100

  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter']

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        minWidth: '600px',
        maxWidth: '1000px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '24px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.125)',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 0 40px rgba(0,150,255,0.1), 0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 100
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#E0E0E0',
          fontSize: '14px',
          fontWeight: 500,
          minWidth: '60px',
          textAlign: 'center'
        }}
      >
        {formatTime(time)}
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          height: '24px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '6px',
            borderRadius: '3px',
            background: 'linear-gradient(to right, #FF6B35 0%, #FFD93D 50%, #6BCB77 100%)',
            opacity: 0.8
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${percentage}%`,
            height: '6px',
            borderRadius: '3px',
            background: 'transparent',
            borderTop: '2px solid rgba(255,255,255,0.5)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={time}
          onChange={handleSliderChange}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            width: '100%',
            height: '24px',
            margin: 0,
            padding: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 2
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #4a90d9;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transition: transform 0.15s ease;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
          input[type="range"]::-webkit-slider-thumb:active {
            transform: scale(0.95);
          }
          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #4a90d9;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          }
        `}</style>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}
      >
        {seasons.map((s) => (
          <SeasonButton
            key={s}
            season={s}
            isActive={season === s}
            onClick={() => setSeason(s)}
          />
        ))}
      </div>

      <button
        onClick={toggleHeatmap}
        style={{
          padding: '8px 16px',
          border: showHeatmap ? '2px solid #FF5252' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: '6px',
          background: showHeatmap ? 'rgba(255,82,82,0.2)' : 'rgba(255,255,255,0.05)',
          color: '#E0E0E0',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease-out',
          outline: 'none',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        }}
        onMouseDown={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
        }}
      >
        {showHeatmap ? '隐藏热力图' : '显示热力图'}
      </button>
    </div>
  )
}
