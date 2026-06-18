import { Link } from 'react-router-dom';
import { Calendar, Flower2 } from 'lucide-react';
import type { Plant } from '../stores/plantStore';
import { statusColors, statusLabels } from '../stores/plantStore';
import './PlantCard.css';

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const color = statusColors[plant.status];
  const label = statusLabels[plant.status];

  return (
    <Link to={`/plants/${plant.id}`} className="plant-card">
      <div className="plant-card-header">
        <span className="plant-status-tag" style={{ background: color }}>
          {label}
        </span>
      </div>
      <h3 className="plant-card-name">{plant.name}</h3>
      {plant.variety && <p className="plant-card-variety">{plant.variety}</p>}
      <div className="plant-card-info">
        <div className="plant-card-info-item">
          <Calendar size={14} color="#95A5A6" />
          <span>种植 {plant.plantDate}</span>
        </div>
        {(plant.expectedBloomDate || plant.expectedHarvestDate) && (
          <div className="plant-card-info-item">
            <Flower2 size={14} color="#95A5A6" />
            <span>
              {plant.expectedHarvestDate
                ? `收获 ${plant.expectedHarvestDate}`
                : `开花 ${plant.expectedBloomDate}`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
