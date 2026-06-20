import React, { useState } from 'react';
import { Droplet, Triangle, Circle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Plant } from '@/types';
import { calculateWaterStatus, formatDate } from '@/utils/plantHelper';

interface PlantCardProps {
  plant: Plant;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, isSelected, onClick, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const waterStatus = calculateWaterStatus(plant);
  const hasAlert = plant.alerts.some(a => !a.resolved);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
    onClick();
  };

  const getStatusIcon = () => {
    switch (waterStatus) {
      case 'normal':
        return <Droplet size={16} className="droplet" />;
      case 'need-water-soon':
        return <Triangle size={16} className="triangle" />;
      case 'need-water-now':
        return <Circle size={16} className="circle" />;
      default:
        return <Droplet size={16} className="droplet" />;
    }
  };

  const getStatusText = () => {
    switch (waterStatus) {
      case 'normal':
        return { text: '水分正常', className: 'water-status-normal' };
      case 'need-water-soon':
        return { text: '即将需水', className: 'water-status-warning' };
      case 'need-water-now':
        return { text: '已缺水', className: 'water-status-danger' };
      default:
        return { text: '水分正常', className: 'water-status-normal' };
    }
  };

  const statusInfo = getStatusText();
  const latestLog = plant.growthLogs[plant.growthLogs.length - 1];
  const latestWater = plant.waterRecords[0];

  const getPlantEmoji = () => {
    switch (plant.category) {
      case '蔬菜':
        return '🥬';
      case '花卉':
        return '🌸';
      case '香草':
        return '🌿';
      case '果树':
        return '🍎';
      default:
        return '🌱';
    }
  };

  return (
    <motion.div
      className={`plant-card ${isFlipped ? 'flipped' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{ willChange: 'transform, opacity' }}
    >
      <div className="plant-card-inner">
        <div className="plant-card-front">
          <div className="status-icon">{getStatusIcon()}</div>
          {hasAlert && (
            <div className="alert-badge">
              <AlertTriangle size={20} />
            </div>
          )}
          <div className="photo-placeholder">{getPlantEmoji()}</div>
          <div className="plant-name">{plant.name}</div>
          <div className="plant-variety">{plant.variety}</div>
          <div className="plant-info">
            位置: {plant.location}
            <br />
            种植: {formatDate(plant.plantDate)}
          </div>
          <div className={`water-status-text ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        </div>

        <div className="plant-card-back">
          <div className="status-icon">{getStatusIcon()}</div>
          <div className="card-back-title">📊 最新生长数据</div>
          {latestLog ? (
            <div className="scrollable">
              <div className="log-small">日期: {formatDate(latestLog.date)}</div>
              <div className="log-small">高度: {latestLog.height} cm</div>
              <div className="log-small">叶片: {latestLog.leafCount} 片</div>
              <div className="log-small">湿度: {latestLog.soilMoisture}%</div>
            </div>
          ) : (
            <div className="log-small">暂无生长记录</div>
          )}

          <div className="card-back-title" style={{ marginTop: '8px' }}>
            💧 最近浇水
          </div>
          {latestWater ? (
            <div className="log-small">
              {formatDate(latestWater.date)} - {latestWater.type === 'water' ? '浇水' : latestWater.type === 'fertilize' ? '施肥' : '修剪'}
              {latestWater.amount ? ` (${latestWater.amount}ml)` : ''}
            </div>
          ) : (
            <div className="log-small">暂无浇水记录</div>
          )}

          <div className={`water-status-text ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
