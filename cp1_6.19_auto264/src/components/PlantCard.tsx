import { useState } from 'react';
import type { Plant } from '../types';
import './PlantCard.css';

interface PlantCardProps {
  plant: Plant;
  onRequestExchange?: (plant: Plant) => void;
  showExchangeButton?: boolean;
}

const statusColors: Record<string, string> = {
  available: '#2ECC71',
  pending: '#F39C12',
  exchanged: '#95A5A6'
};

const statusLabels: Record<string, string> = {
  available: '可交换',
  pending: '待确认',
  exchanged: '已交换'
};

function PlantCard({ plant, onRequestExchange, showExchangeButton = false }: PlantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const renderStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  return (
    <div
      className={`plant-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="plant-image-wrapper">
        {plant.image && !imageError ? (
          <img
            src={plant.image}
            alt={plant.name}
            className="plant-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="plant-image-placeholder">
            🌿
          </div>
        )}
      </div>

      <div className="plant-info">
        <div className="plant-header">
          <h3 className="plant-name">{plant.name}</h3>
          <span
            className="status-dot"
            style={{ backgroundColor: statusColors[plant.status] }}
            title={statusLabels[plant.status]}
          />
        </div>
        <p className="plant-variety">{plant.variety}</p>
        <p className="plant-difficulty" style={{ color: '#F39C12' }}>
          {renderStars(plant.difficulty)}
        </p>

        {expanded && (
          <div className="plant-details" onClick={e => e.stopPropagation()}>
            <p className="plant-habits">{plant.habits}</p>
            <p className="plant-owner">主人：{plant.ownerName}</p>
            {showExchangeButton && plant.status === 'available' && (
              <button
                className="exchange-btn"
                onClick={e => {
                  e.stopPropagation();
                  onRequestExchange?.(plant);
                }}
              >
                申请交换
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlantCard;
