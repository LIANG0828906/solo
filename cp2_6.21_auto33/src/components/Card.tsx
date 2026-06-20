import React from 'react'

interface CardProps {
  icon: string
  label: string
  value: number
  unit: string
  color: string
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({ icon, label, value, unit, color, onClick }) => {
  return (
    <div className="health-card" onClick={onClick}>
      <div className="card-icon" style={{ color }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
      <div className="card-unit">{unit}</div>
    </div>
  )
}

export default Card
