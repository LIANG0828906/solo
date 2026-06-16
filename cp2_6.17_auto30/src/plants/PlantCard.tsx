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

  const wateringBaseDate = plant.lastWateringDate || plant.purchaseDate;
  const nextWateringDate = formatDate(addDays(wateringBaseDate, plant.wateringInterval));
  const wateringDaysLeft = daysFromToday(nextWateringDate);

  const repottingBaseDate = plant.lastRepottingDate || plant.purchaseDate;
  const nextRepottingDate = formatDate(addDays(repottingBaseDate, 365));
  const repottingDaysLeft = daysFromToday(nextRepottingDate);

  const minDaysLeft = Math.min(wateringDaysLeft, repottingDaysLeft);

  const getStatusColor = () => {
    if (minDaysLeft < 0 || minDaysLeft <= 3) return '#E74C3C';
    if (minDaysLeft <= 7) return '#F39C12';
    return '#27AE60';
  };

  const getStatusLabel = () => {
    if (minDaysLeft < 0) return `已超期${Math.abs(minDaysLeft)}天`;
    if (minDaysLeft === 0) return '今日到期';
    return `${minDaysLeft}天后`;
  };

  const getWateringText = () => {
    if (wateringDaysLeft < 0) return `${Math.abs(wateringDaysLeft)}天前需浇水`;
    if (wateringDaysLeft === 0) return '今天浇水';
    return `${wateringDaysLeft}天后浇水`;
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).style.display = 'none';
    const parent = (e.target as HTMLImageElement).parentElement;
    if (parent) {
      parent.classList.add('no-photo');
    }
  };

  return (
    <div className="plant-card" onClick={handleCardClick}>
      <div className="card-top">
        <div className="card-thumb">
          {plant.photoUrl ? (
            <img
              src={plant.photoUrl}
              alt={plant.name}
              onError={handleImageError}
            />
          ) : (
            <span className="thumb-placeholder">🌵</span>
          )}
        </div>
        <div className="card-title-group">
          <h3 className="plant-name">{plant.name}</h3>
          <p className="plant-species">{plant.species || '未知品种'}</p>
        </div>
        <button
          className={`favorite-btn ${plant.isFavorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={plant.isFavorite ? '取消收藏' : '收藏'}
        >
          {plant.isFavorite ? '⭐' : '☆'}
        </button>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="info-icon">📍</span>
          <span className="info-text">{plant.location || '位置未设置'}</span>
        </div>
        <div className="info-row">
          <span className="info-icon">☀️</span>
          <span className="info-text">{plant.lightPreference}</span>
        </div>
        <div className="info-row">
          <span className="info-icon">💧</span>
          <span className="info-text">{plant.wateringInterval}天/次</span>
        </div>
      </div>

      <div className="card-bottom">
        <div className="watering-info">
          <span className="watering-label">下次浇水</span>
          <span className="watering-days">{getWateringText()}</span>
        </div>
        <div className="status-indicator" title={`养护状态：${getStatusLabel()}`}>
          <span className="status-dot" style={{ backgroundColor: getStatusColor() }} />
          <span className="status-text">{getStatusLabel()}</span>
        </div>
      </div>
    </div>
  );
}
