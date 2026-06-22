import { Link } from 'react-router-dom'
import type { Plant, HealthStatus } from '@/types'
import { getHealthGradient, getEventHealthStatus, defaultPlantIcon } from '@/utils/eventUtils'

interface HealthBadgeProps {
  plant: Plant
}

export function HealthBadge({ plant }: HealthBadgeProps) {
  const latestEvent = plant.events.length > 0
    ? [...plant.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null

  const healthStatus: HealthStatus = latestEvent
    ? getEventHealthStatus(latestEvent.type)
    : 'none'

  const gradient = getHealthGradient(healthStatus)
  const imageSrc = plant.mainImage || defaultPlantIcon

  return (
    <Link
      to={`/plant/${plant.id}`}
      className="health-badge"
      title={plant.name}
    >
      <div className="health-badge-ring" style={{ background: gradient }}>
        <div className="health-badge-inner">
          <img src={imageSrc} alt={plant.name} loading="lazy" />
        </div>
      </div>
      <span className="health-badge-tooltip">{plant.name}</span>
    </Link>
  )
}
