import { Link } from 'react-router-dom'
import type { CoffeeBean } from '@/types'

interface CoffeeCardProps {
  coffee: CoffeeBean
}

export default function CoffeeCard({ coffee }: CoffeeCardProps) {
  return (
    <Link to={`/beans/${coffee.id}`} className="coffee-card">
      <div
        className="coffee-card-image"
        style={{
          background: `linear-gradient(135deg, ${coffee.imageColor} 0%, ${coffee.imageColor}99 100%)`,
        }}
      />
      <div className="coffee-card-content">
        <h3 className="coffee-card-name">{coffee.name}</h3>
        <p className="coffee-card-origin">{coffee.origin}</p>
        <p className="coffee-card-processing">处理法：{coffee.processing}</p>
        <div className="coffee-card-flavors">
          {coffee.flavorNotes.slice(0, 3).map((note, index) => (
            <span key={index} className="coffee-card-flavor-tag">
              {note}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
