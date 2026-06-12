import React, { useMemo } from 'react'

interface TimerDisplayProps {
  remainingTime: number
  totalDuration: number
  label?: string
  isBreak?: boolean
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  remainingTime,
  totalDuration,
  label,
  isBreak = false,
}) => {
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const progress = totalDuration > 0 ? (totalDuration - remainingTime) / totalDuration : 0
  const strokeDashoffset = circumference * (1 - progress)

  const gradientId = useMemo(() => `timerGradient-${Math.random().toString(36).substr(2, 9)}`, [])

  const minutes = Math.floor(remainingTime / 60)
  const seconds = Math.floor(remainingTime % 60)
  const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const startColor = isBreak ? '#74b9ff' : '#ff6b6b'
  const endColor = isBreak ? '#0984e3' : '#4ecdc4'

  return (
    <div className="timer-display-container">
      <svg className="timer-svg" viewBox="0 0 300 300">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        <circle
          className="timer-circle-bg"
          cx="150"
          cy="150"
          r={radius}
        />
        <circle
          className="timer-circle-progress"
          cx="150"
          cy="150"
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="timer-text">{displayTime}</div>
      {label && <div className="timer-label">{label}</div>}
    </div>
  )
}

export default TimerDisplay
