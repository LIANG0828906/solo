import { Link } from 'react-router-dom'
import type { Plant } from '@/types'
import { getGrowthDays, formatDate } from '@/utils/dateUtils'
import { defaultPlantIcon } from '@/utils/eventUtils'
import { EventIcon } from './EventIcon'

interface PlantCardProps {
  plant: Plant
}

export function PlantCard({ plant }: PlantCardProps) {
  const growthDays = getGrowthDays(plant.plantDate)
  const progress = Math.min(100, Math.round((growthDays / plant.expectedMaturityDays) * 100))
  const imageSrc = plant.mainImage || defaultPlantIcon

  const latestEvent = plant.events.length > 0
    ? [...plant.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null

  return (
    <Link to={`/plant/${plant.id}`} className="plant-card">
      <div className="plant-card-image">
        <img src={imageSrc} alt={plant.name} loading="lazy" />
      </div>
      <div className="plant-card-content">
        <div className="plant-card-header">
          <h3 className="plant-card-name">{plant.name}</h3>
          <span className="plant-card-days">
            {growthDays} 天
          </span>
        </div>
        <p className="plant-card-variety">{plant.variety}</p>
        
        <div className="plant-card-progress">
          <div className="plant-card-progress-bar">
            <div 
              className="plant-card-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="plant-card-progress-text">{progress}% 成熟</span>
        </div>

        {latestEvent && (
          <div className="plant-card-latest">
            <EventIcon type={latestEvent.type} size={16} />
            <span className="plant-card-latest-text">
              {latestEvent.description.length > 30 
                ? latestEvent.description.slice(0, 30) + '...' 
                : latestEvent.description}
            </span>
          </div>
        )}

        <div className="plant-card-footer">
          <span className="plant-card-date">
            种植于 {formatDate(plant.plantDate)}
          </span>
          <span className="plant-card-event-count">
            {plant.events.length} 条记录
          </span>
        </div>
      </div>
    </Link>
  )
}
