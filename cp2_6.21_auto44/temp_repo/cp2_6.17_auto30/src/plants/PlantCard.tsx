import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatDate, addDays, daysFromToday } from '../utils/dateUtils';
import type { Plant } from '../types';
import './PlantCard.css';

interface PlantCardProps {
  plant: Plant;
}

function getSpeciesName(plant: Plant): string {
  const species = plant.species;
  if (species === undefined || species === null || species.trim() === '') {
    return '未知品种';
  }
  return species;
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

  const careItems = [
    { days: wateringDaysLeft, type: '浇水' },
    { days: repottingDaysLeft, type: '换盆' }
  ];
  const nearest = careItems.reduce((prev, curr) =>
    curr.days < prev.days ? curr : prev
  , careItems[0]);
  const minDaysLeft = nearest.days;
  const nearestType = nearest.type;

  const getStatusColor = () => {
    if (minDaysLeft < 0 || minDaysLeft <= 3) return '#E74C3C';
    if (minDaysLeft <= 7) return '#F39C12';
    return '#27AE60';
  };

  const getStatusLabel = () => {
    if (minDaysLeft < 0) return `已超期${Math.abs(minDaysLeft)}天`;
    if (minDaysLeft === 0) return `${nearestType}今日`;
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
    const img = e.target as HTMLImageElement;
    const parent = img.parentElement;
    if (!parent) return;
    img.style.display = 'none';
    parent.classList.add('no-photo');
    let placeholder = parent.querySelector('.thumb-placeholder');
    if (!placeholder) {
      placeholder = document.createElement('span');
      placeholder.className = 'thumb-placeholder';
      placeholder.textContent = '🌵';
      parent.appendChild(placeholder);
    }
    (placeholder as HTMLElement).style.display = 'flex';
  };

  return (
    <div className="plant-card" onClick={handleCardClick}>
      <div className="card-top">
        <div className="card-thumb">
          {plant.photoUrl && plant.photoUrl.trim() !== '' ? (
            <img
              src={plant.photoUrl}
              alt={plant.name}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <span className="thumb-placeholder">🌵</span>
          )}
        </div>
        <div className="card-title-group">
          <h3 className="plant-name">{plant.name}</h3>
          <p className="plant-species">{getSpeciesName(plant)}</p>
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
        <div
          className="status-indicator"
          title={`最近养护：${nearestType}，${getStatusLabel()}`}
        >
          <span className="status-dot" style={{ backgroundColor: getStatusColor() }} />
          <span className="status-text">{getStatusLabel()}</span>
        </div>
      </div>
    </div>
  );
}
