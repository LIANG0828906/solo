import React from 'react'

interface CardProps {
  icon: string
  label: string
  value: number
  unit: string
  color: string
  progress?: number
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({ icon, label, value, unit, color, progress = 0, onClick }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  return (
    <div className="health-card" onClick={onClick} style={{ '--card-progress-color': color } as React.CSSProperties}>
      <div className="card-icon" style={{ color }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
      <div className="card-unit">{unit}</div>
      <div className="card-progress-track">
        <div
          className="card-progress-fill"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  )
}

export default Card
