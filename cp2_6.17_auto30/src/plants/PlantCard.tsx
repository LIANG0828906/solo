import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatDate, addDays, daysFromToday } from '../utils/dateUtils';
import type { Plant } from '../types';
import './PlantCard.css';

interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  const navigate = useNavigate();
  const toggleFavorite = useStore(state => state.toggleFavorite);

  const baseDate = plant.lastWateringDate || plant.purchaseDate;
  const nextWateringDate = formatDate(addDays(baseDate, plant.wateringInterval));
  const daysLeft = daysFromToday(nextWateringDate);

  const getWateringText = () => {
    if (daysLeft < 0) return `${Math.abs(daysLeft)}天前需浇水`;
    if (daysLeft === 0) return '今天需要浇水';
    return `${daysLeft}天后浇水`;
  };

  const getWateringColor = () => {
    if (daysLeft < 0) return '#E74C3C';
    if (daysLeft <= 1) return '#F39C12';
    return '#27AE60';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.favorite-btn')) {
      navigate(`/plants/${plant.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(plant.id);
  };

  return (
    <div className="plant-card" onClick={handleCardClick}>
      <div className="card-photo">
        {plant.photoUrl ? (
          <img
            src={plant.photoUrl}
            alt={plant.name}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.classList.add('no-photo');
            }}
          />
        ) : (
          <div className="no-photo-text">无图片</div>
        )}
      </div>
      <div className="card-info">
        <div className="card-header">
          <div>
            <h3 className="plant-name">{plant.name}</h3>
            <p className="plant-species">{plant.species}</p>
          </div>
          <button
            className={`favorite-btn ${plant.isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={plant.isFavorite ? '取消收藏' : '收藏'}
          >
            {plant.isFavorite ? '⭐' : '☆'}
          </button>
        </div>
        <p className="watering-info" style={{ color: getWateringColor() }}>
          💧 {getWateringText()}
        </p>
      </div>
    </div>
  );
}
