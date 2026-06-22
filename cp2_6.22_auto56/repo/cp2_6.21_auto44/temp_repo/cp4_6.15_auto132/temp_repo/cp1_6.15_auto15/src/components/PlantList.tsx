import React, { useMemo, useState } from 'react';
import { useAppContext } from '../App';
import PlantCard from './PlantCard';
import type { SortBy, HealthStatus, Plant } from '../types';
import { getPlantAgeDays } from '../utils/dateUtils';
import './PlantList.css';

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'recent', label: '最近更新' },
  { value: 'duration', label: '种植时长' },
  { value: 'variety', label: '品种' }
];

const filterLabels: Record<HealthStatus, string> = {
  healthy: '健康',
  normal: '一般',
  attention: '需要关注'
};

const PlantList: React.FC = () => {
  const {
    plants,
    sortBy,
    filterStatus,
    setSortBy,
    setFilterStatus,
    toggleDashboard,
    navigate
  } = useAppContext();

  const [contextMenu, setContextMenu] = useState<{
    plantId: string;
    x: number;
    y: number;
  } | null>(null);

  const sortedAndFilteredPlants = useMemo(() => {
    let result = [...plants];
    
    if (filterStatus) {
      result = result.filter(p => p.healthStatus === filterStatus);
    }
    
    switch (sortBy) {
      case 'variety':
        result.sort((a, b) => a.variety.localeCompare(b.variety));
        break;
      case 'duration':
        result.sort((a, b) => getPlantAgeDays(b.plantDate) - getPlantAgeDays(a.plantDate));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }
    
    return result;
  }, [plants, sortBy, filterStatus]);

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, plantId: string) => {
    e.preventDefault();
    let x: number, y: number;
    
    if ('touches' in e) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }
    
    setContextMenu({ plantId, x, y });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const getStaggerClass = (index: number) => {
    const staggerIndex = (index % 8) + 1;
    return `stagger-${staggerIndex}`;
  };

  return (
    <div 
      className="page-container"
      onClick={closeContextMenu}
    >
      <header className="list-header">
        <div className="header-content">
          <h1 className="app-title handwriting">
            🌱 植物成长手账
          </h1>
          <p className="app-subtitle">记录每一片叶子的故事</p>
        </div>
        <div className="header-actions">
          <button 
            className="pill-btn pill-btn-secondary"
            onClick={toggleDashboard}
          >
            <span>📊</span>
            <span>统计</span>
          </button>
          <button 
            className="pill-btn pill-btn-primary"
            onClick={() => navigate('add')}
          >
            <span>＋</span>
            <span>添加植物</span>
          </button>
        </div>
      </header>

      <div className="list-toolbar">
        <div className="sort-group">
          <span className="toolbar-label">排序：</span>
          <div className="sort-buttons">
            {sortOptions.map(option => (
              <button
                key={option.value}
                className={`sort-btn ${sortBy === option.value ? 'active' : ''}`}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {filterStatus && (
          <div className="filter-indicator">
            <span className="pill-tag" style={{ 
              background: filterStatus === 'healthy' ? 'rgba(76, 175, 80, 0.2)' :
                          filterStatus === 'normal' ? 'rgba(255, 193, 7, 0.2)' :
                          'rgba(255, 87, 34, 0.2)',
              color: filterStatus === 'healthy' ? 'var(--color-healthy)' :
                     filterStatus === 'normal' ? '#F57C00' :
                     'var(--color-attention)'
            }}>
              已筛选：{filterLabels[filterStatus]}
              <button 
                className="filter-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterStatus(null);
                }}
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {sortedAndFilteredPlants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌿</div>
          <p className="empty-text">
            {filterStatus ? '没有符合筛选条件的植物' : '还没有添加植物哦'}
          </p>
          <button 
            className="pill-btn pill-btn-primary"
            onClick={() => {
              setFilterStatus(null);
              navigate('add');
            }}
          >
            添加第一株植物
          </button>
        </div>
      ) : (
        <div className="plant-grid">
          {sortedAndFilteredPlants.map((plant: Plant, index: number) => (
            <div
              key={plant.id}
              className={`animate-fade-in-up ${getStaggerClass(index)}`}
            >
              <PlantCard
                plant={plant}
                onContextMenu={(e) => handleContextMenu(e, plant.id)}
              />
            </div>
          ))}
        </div>
      )}

      {contextMenu && (
        <div 
          className="context-menu glass-card"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 'var(--z-dropdown)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ContextMenuItem
            plantId={contextMenu.plantId}
            onClose={closeContextMenu}
          />
        </div>
      )}
    </div>
  );
};

const ContextMenuItem: React.FC<{
  plantId: string;
  onClose: () => void;
}> = ({ plantId, onClose }) => {
  const { plants, toggleFavorite, deletePlant, navigate } = useAppContext();
  const plant = plants.find(p => p.id === plantId);

  const handleDelete = () => {
    if (confirm(`确定要删除「${plant?.name}」吗？`)) {
      deletePlant(plantId);
    }
    onClose();
  };

  const handleToggleFavorite = () => {
    toggleFavorite(plantId);
    onClose();
  };

  const handleViewDetail = () => {
    navigate('detail', plantId);
    onClose();
  };

  return (
    <>
      <button className="context-menu-item" onClick={handleViewDetail}>
        <span>📖</span> 查看详情
      </button>
      <button className="context-menu-item" onClick={handleToggleFavorite}>
        <span>{plant?.isFavorite ? '⭐' : '☆'}</span>
        {plant?.isFavorite ? '取消收藏' : '设为收藏'}
      </button>
      <button className="context-menu-item danger" onClick={handleDelete}>
        <span>🗑️</span> 删除
      </button>
    </>
  );
};

export default PlantList;
