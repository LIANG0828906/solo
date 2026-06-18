import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plant } from '../types';
import { formatCountdown } from '../utils/dateUtils';
import { WaterDropIcon } from './Icons';
import { usePlantStore } from '../store/plantStore';

interface PlantCardProps {
  plant: Plant;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  const navigate = useNavigate();
  const { waterPlant, deletePlant } = usePlantStore();
  const { text: countdownText, isOverdue } = formatCountdown(
    plant.lastWateredDate,
    plant.waterFrequency
  );

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.plant-card-actions')) {
      return;
    }
    navigate(`/plant/${plant.id}`);
  };

  const handleWater = (e: React.MouseEvent) => {
    e.stopPropagation();
    void waterPlant(plant.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除「${plant.name}」吗？`)) {
      void deletePlant(plant.id);
    }
  };

  return (
    <div className="plant-card" onClick={handleCardClick}>
      <div className="plant-card-header">
        <div>
          <h3 className="plant-name">{plant.name}</h3>
          <p className="plant-category">{plant.category}</p>
        </div>
      </div>

      <div className="water-info">
        <div className={`water-drop ${isOverdue ? 'overdue' : ''}`}>
          <WaterDropIcon />
        </div>
        <span className={`countdown-text ${isOverdue ? 'overdue' : ''}`}>
          {countdownText}
        </span>
      </div>

      <div className="plant-card-actions">
        <button
          className="btn-secondary"
          onClick={handleWater}
          title="完成浇水"
        >
          完成浇水
        </button>
        <button
          className="btn-danger"
          onClick={handleDelete}
          title="删除植物"
        >
          删除
        </button>
      </div>
    </div>
  );
};

export default PlantCard;
