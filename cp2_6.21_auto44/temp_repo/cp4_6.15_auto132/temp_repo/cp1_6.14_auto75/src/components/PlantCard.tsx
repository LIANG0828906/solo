import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Plant } from '../api/plantApi'

interface PlantCardProps {
  plant: Plant
  index: number
}

const PlantCard = ({ plant, index }: PlantCardProps) => {
  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleClick = () => {
    navigate(`/plant/${plant.id}`)
  }

  return (
    <div 
      className="plant-card" 
      onClick={handleClick}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="plant-card-image">
        {plant.photo && (
          <img
            src={plant.photo}
            alt={plant.name}
            loading="lazy"
            className={imageLoaded ? 'loaded' : ''}
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>
      <div className="plant-card-body">
        <div className="plant-card-name">{plant.name}</div>
        <div className="plant-card-tags">
          <span className="tag">{plant.species}</span>
          <span className="tag">{plant.location}</span>
        </div>
      </div>
    </div>
  )
}

export default PlantCard
