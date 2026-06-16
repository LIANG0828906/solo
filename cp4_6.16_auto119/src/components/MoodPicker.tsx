import { useState } from 'react'
import { MOOD_CONFIGS } from '../types'
import type { MoodType, MoodConfig } from '../types'
import './MoodPicker.css'

interface MoodPickerProps {
  selectedMood?: MoodType
  onSelect: (moodType: MoodType) => void
}

function MoodPicker({ selectedMood, onSelect }: MoodPickerProps) {
  const [animatingMood, setAnimatingMood] = useState<MoodType | null>(null)

  const handleClick = (config: MoodConfig) => {
    setAnimatingMood(config.type)
    onSelect(config.type)
    setTimeout(() => setAnimatingMood(null), 400)
  }

  return (
    <div className="mood-picker">
      <div className="mood-grid">
        {MOOD_CONFIGS.map((config) => {
          const isSelected = selectedMood === config.type
          const isAnimating = animatingMood === config.type
          
          return (
            <button
              key={config.type}
              className={`mood-card ${isSelected ? 'selected' : ''} ${isAnimating ? 'animating' : ''}`}
              style={{ 
                '--mood-color': config.color,
                backgroundColor: isSelected ? config.color : 'var(--bg-white)',
              } as React.CSSProperties}
              onClick={() => handleClick(config)}
              aria-label={config.label}
            >
              <span className="mood-emoji">{config.emoji}</span>
              <span className="mood-label">{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MoodPicker
