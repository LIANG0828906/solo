import React from 'react'
import { Building, styleColors } from '../data/buildings'

interface BuildingCardProps {
  building: Building
  onClick: (building: Building) => void
}

const BuildingCard: React.FC<BuildingCardProps> = ({ building, onClick }) => {
  const color = styleColors[building.style]

  return (
    <div className="building-card" onClick={() => onClick(building)}>
      <div className="card-image">
        <div
          className="card-image-pattern"
          style={{ backgroundColor: color }}
        />
        <span className="card-style-tag">{building.style}</span>
      </div>
      <div className="card-content">
        <div className="card-name">{building.name}</div>
        <div className="card-address">{building.address}</div>
        <div className="card-year">{building.year}年</div>
        <div className="card-description">{building.description}</div>
      </div>
    </div>
  )
}

export default BuildingCard
