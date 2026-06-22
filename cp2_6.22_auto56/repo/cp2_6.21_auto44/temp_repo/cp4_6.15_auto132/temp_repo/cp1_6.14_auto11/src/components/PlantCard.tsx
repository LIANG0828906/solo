import { memo } from 'react';
import type { Plant } from '../types';

interface PlantCardProps {
  plant: Plant;
  onClick: () => void;
  style?: React.CSSProperties;
}

const statusMap: Record<string, { label: string; color: string }> = {
  seedling: { label: '幼苗期', color: '#90c878' },
  growing: { label: '生长期', color: '#6bb36b' },
  flowering: { label: '开花期', color: '#e880a0' },
  dormant: { label: '休眠期', color: '#a0a090' },
};

function PlantCard({ plant, onClick, style }: PlantCardProps) {
  const statusInfo = statusMap[plant.status] || statusMap.growing;
  const daysPlanted = Math.floor(
    (Date.now() - plant.plantDate) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className="plant-card fade-in"
      onClick={onClick}
      style={style}
    >
      {plant.photo ? (
        <img
          src={plant.photo.url}
          alt={plant.name}
          className="plant-card-photo"
          loading="lazy"
        />
      ) : (
        <div className="plant-card-photo" />
      )}
      <div className="plant-card-body">
        <div className="plant-card-name">{plant.name}</div>
        <div className="plant-card-species">{plant.species}</div>
        <span
          className="plant-card-status"
          style={{ background: statusInfo.color }}
        >
          {statusInfo.label}
        </span>
        <div className="plant-card-meta">
          <span>🌱 种植 {daysPlanted} 天</span>
          <span>💧 {plant.careRules.waterFrequency}天/次</span>
        </div>
      </div>
    </div>
  );
}

export default memo(PlantCard);
