import React, { useMemo } from 'react';
import type { Cat, HealthStatus } from '../types';
import CatCard from './CatCard';

interface ShelterMapProps {
  cats: Cat[];
  onCatClick: (cat: Cat) => void;
  onDragStart: (cat: Cat, e: React.MouseEvent | React.TouchEvent) => void;
}

interface AreaConfig {
  id: string;
  name: string;
  icon: string;
  top: string;
  left: string;
  width: string;
  height: string;
  bgColor: string;
  borderColor: string;
}

const areas: AreaConfig[] = [
  {
    id: 'reception',
    name: '接待区',
    icon: '🏠',
    top: '5%',
    left: '2%',
    width: '30%',
    height: '38%',
    bgColor: 'rgba(255, 200, 150, 0.25)',
    borderColor: '#FFB085',
  },
  {
    id: 'checkup',
    name: '体检室',
    icon: '🏥',
    top: '5%',
    left: '35%',
    width: '28%',
    height: '38%',
    bgColor: 'rgba(180, 220, 255, 0.25)',
    borderColor: '#90CAF9',
  },
  {
    id: 'shelter',
    name: '猫舍区',
    icon: '🐾',
    top: '47%',
    left: '2%',
    width: '61%',
    height: '48%',
    bgColor: 'rgba(200, 240, 200, 0.25)',
    borderColor: '#A5D6A7',
  },
  {
    id: 'adoption',
    name: '领养区',
    icon: '💝',
    top: '5%',
    left: '66%',
    width: '32%',
    height: '90%',
    bgColor: 'rgba(255, 200, 220, 0.25)',
    borderColor: '#F8BBD0',
  },
];

const shelterCats: { [key in HealthStatus]: string } = {
  healthy: '健康猫舍',
  mild: '轻度伤病猫舍',
  severe: '重症监护猫舍',
};

const ShelterMap: React.FC<ShelterMapProps> = ({ cats, onCatClick, onDragStart }) => {
  const receptionCats = cats.filter(c => c.area === 'reception');
  const checkupCats = cats.filter(c => c.area === 'checkup');
  const shelterCatsList = cats.filter(c => c.area === 'shelter');
  const adoptionCats = cats.filter(c => c.area === 'adoption');

  const healthyShelter = shelterCatsList.filter(c => c.healthStatus === 'healthy');
  const mildShelter = shelterCatsList.filter(c => c.healthStatus === 'mild');
  const severeShelter = shelterCatsList.filter(c => c.healthStatus === 'severe');

  const catPositions = useMemo(() => {
    const positions: { [catId: string]: { x: number; y: number } } = {};
    
    receptionCats.forEach((cat, index) => {
      const cols = 3;
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions[cat.id] = { x: 10 + col * 30, y: 30 + row * 35 };
    });

    checkupCats.forEach((cat, index) => {
      positions[cat.id] = { x: 10 + index * 25, y: 35 };
    });

    return positions;
  }, [receptionCats.length, checkupCats.length]);

  const renderCatteryGrid = (catList: Cat[], type: HealthStatus, title: string) => {
    if (catList.length === 0) return null;

    const bgColor = {
      healthy: 'rgba(124, 179, 66, 0.15)',
      mild: 'rgba(255, 183, 77, 0.15)',
      severe: 'rgba(239, 83, 80, 0.15)',
    }[type];

    const borderColor = {
      healthy: '#7CB342',
      mild: '#FFB74D',
      severe: '#EF5350',
    }[type];

    return (
      <div className="cattery-block" style={{ backgroundColor: bgColor, borderColor }}>
        <div className="cattery-title">{title} ({catList.length})</div>
        <div className="cattery-grid">
          {catList.map(cat => (
            <div
              key={cat.id}
              className="cattery-cell"
              onClick={() => onCatClick(cat)}
              title={`${cat.name} - 点击查看详情`}
            >
              <div className="cattery-cell-avatar">{cat.avatar}</div>
              <div className="cattery-cell-name">{cat.name}</div>
              <div
                className="cattery-cell-dot"
                style={{ backgroundColor: borderColor }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="shelter-map">
      {areas.map(area => (
        <div
          key={area.id}
          className={`map-area area-${area.id}`}
          style={{
            top: area.top,
            left: area.left,
            width: area.width,
            height: area.height,
            backgroundColor: area.bgColor,
            borderColor: area.borderColor,
          }}
        >
          <div className="area-label">
            <span className="area-icon">{area.icon}</span>
            <span className="area-name">{area.name}</span>
          </div>

          {area.id === 'reception' && (
            <div className="area-content reception-content">
              {receptionCats.length === 0 ? (
                <div className="empty-hint">
                  <p>🐱</p>
                  <p>暂无待接收的猫咪</p>
                  <p className="hint-small">点击"接收新猫咪"添加</p>
                </div>
              ) : (
                <div className="cats-container">
                  {receptionCats.map(cat => (
                    <div
                      key={cat.id}
                      className="cat-position"
                      style={{
                        position: 'absolute',
                        left: `${catPositions[cat.id]?.x || 10}%`,
                        top: `${catPositions[cat.id]?.y || 30}%`,
                      }}
                    >
                      <CatCard
                        cat={cat}
                        size="medium"
                        onDragStart={onDragStart}
                        onClick={() => onCatClick(cat)}
                        showStoryBubble
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="drag-hint">
                💡 拖拽猫咪到体检室进行检查
              </div>
            </div>
          )}

          {area.id === 'checkup' && (
            <div className="area-content checkup-content">
              {checkupCats.length === 0 ? (
                <div className="empty-hint">
                  <p>🔍</p>
                  <p>体检室空闲中</p>
                  <p className="hint-small">拖拽接待区的猫咪到此处</p>
                </div>
              ) : (
                <div className="exam-queue">
                  {checkupCats.map(cat => (
                    <div key={cat.id} className="exam-item">
                      <CatCard
                        cat={cat}
                        size="small"
                        isExamining={cat.isExamining}
                        onClick={() => onCatClick(cat)}
                      />
                      {cat.isExamining && (
                        <div className="exam-status">
                          <div className="progress-bar-wrapper">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${cat.examProgress || 0}%` }}
                            />
                          </div>
                          <span className="progress-text">
                            {cat.examProgress !== undefined
                              ? `体检中 ${Math.round(cat.examProgress)}%`
                              : '排队中...'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {area.id === 'shelter' && (
            <div className="area-content shelter-content paw-pattern">
              {shelterCatsList.length === 0 ? (
                <div className="empty-hint full-empty">
                  <p>🏠</p>
                  <p>猫舍空空如也</p>
                  <p className="hint-small">完成体检的猫咪会被分配到这里</p>
                </div>
              ) : (
                <div className="cattery-container">
                  {renderCatteryGrid(healthyShelter, 'healthy', '🟢 健康猫舍')}
                  {renderCatteryGrid(mildShelter, 'mild', '🟡 轻度伤病猫舍')}
                  {renderCatteryGrid(severeShelter, 'severe', '🔴 重症猫舍')}
                </div>
              )}
            </div>
          )}

          {area.id === 'adoption' && (
            <div className="area-content adoption-content">
              {adoptionCats.length === 0 ? (
                <div className="empty-hint">
                  <p>💝</p>
                  <p>等待领养</p>
                  <p className="hint-small">健康的猫咪可安排进入领养区</p>
                </div>
              ) : (
                <div className="adoption-list">
                  {adoptionCats.map(cat => (
                    <div
                      key={cat.id}
                      className="adoption-item"
                      onClick={() => onCatClick(cat)}
                    >
                      <div className="adoption-avatar">{cat.avatar}</div>
                      <div className="adoption-info">
                        <div className="adoption-name">{cat.name}</div>
                        <div className="adoption-breed">{cat.breed}</div>
                      </div>
                      <span className="adoption-tag">待领养</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ShelterMap;
