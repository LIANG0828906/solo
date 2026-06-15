import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantStore } from './store';
import { PlantCard } from './PlantCard';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const plants = usePlantStore(s => s.plants);
  const isLoaded = usePlantStore(s => s.isLoaded);
  const allRecords = usePlantStore(s => {
    return Object.values(s.records).flat();
  });

  const urgentCount = plants.filter(p => {
    const plantRecords = allRecords.filter(r => r.plantId === p.id && r.type === 'water');
    if (plantRecords.length === 0) return true;
    const lastWater = Math.max(...plantRecords.map(r => r.date));
    const nextWater = lastWater + p.waterFrequency * 24 * 60 * 60 * 1000;
    return nextWater <= Date.now();
  }).length;

  if (!isLoaded) {
    return (
      <div className="page-fade loading-page">
        <div className="loading-icon">🌿</div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="page-fade home-page">
      <header className="home-header">
        <div className="home-header-inner">
          <div>
            <h1 className="home-title">🌿 Herbarium</h1>
            <p className="home-subtitle">
              {plants.length === 0
                ? '开始记录你的第一株植物吧'
                : `共 ${plants.length} 株植物${urgentCount > 0 ? ` · ${urgentCount} 株需要浇水` : ''}`}
            </p>
          </div>
          <button className="add-btn ripple" onClick={() => navigate('/add')}>
            +
          </button>
        </div>
      </header>

      {plants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🪴</div>
          <h2>还没有植物</h2>
          <p>点击右上角的 + 添加你的第一株植物</p>
          <button className="submit-btn ripple" onClick={() => navigate('/add')}>
            开始添加
          </button>
        </div>
      ) : (
        <div className="plant-grid">
          {plants.map((plant, idx) => (
            <div key={plant.id} style={{ animationDelay: `${idx * 50}ms` }}>
              <PlantCard plant={plant} records={allRecords} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
