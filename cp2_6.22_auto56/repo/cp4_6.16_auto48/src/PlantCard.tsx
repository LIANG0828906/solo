import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Plant, PlantRecord } from './types';
import { getDaysUntilWatering } from './utils';

interface PlantCardProps {
  plant: Plant;
  records: PlantRecord[];
}

const CATEGORY_ICONS: Record<string, string> = {
  '多肉': '🌵',
  '蕨类': '🌿',
  '观叶': '🍃',
  '开花': '🌸',
  '仙人掌': '🌵',
};

export const PlantCard: React.FC<PlantCardProps> = ({ plant, records }) => {
  const navigate = useNavigate();
  const days = getDaysUntilWatering(plant, records);
  const urgent = days <= 0;
  const waterText = urgent ? '今天要浇水' : `还剩${days}天`;

  return (
    <div
      className={`plant-card card-fade ripple ${urgent ? 'plant-card-urgent' : ''}`}
      onClick={() => navigate(`/plant/${plant.id}`)}
    >
      {urgent && (
        <div className="water-pulse">
          <span>💧</span>
        </div>
      )}

      <div className="plant-thumb">
        <img src={plant.avatar} alt={plant.name} loading="lazy" />
      </div>

      <div className="plant-info">
        <h3 className="plant-name">{plant.name}</h3>
        <div className="tag-row">
          <span className="tag tag-category">
            {CATEGORY_ICONS[plant.category] || '🌱'} {plant.category}
          </span>
        </div>
        <div className="tag-row">
          <span className="tag tag-light">☀️ {plant.light}</span>
          <span className="tag tag-location">📍 {plant.location}</span>
        </div>
        <div className={`water-countdown ${urgent ? 'water-countdown-urgent' : ''}`}>
          💧 {waterText}
        </div>
      </div>
    </div>
  );
};
