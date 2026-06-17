import { useMemo, useRef } from 'react';
import { useGardenStore } from '../store/gardenStore';
import { WEATHER_ICONS, WEATHER_NAMES } from '../api/weatherApi';
import type { Plant } from '../types';
import './StatsPanel.css';

const StatsPanel = () => {
  const plants = useGardenStore((s) => s.plants);
  const weather = useGardenStore((s) => s.weather);
  const harvestedCount = useGardenStore((s) => s.harvestedCount);
  const harvestAllFlowering = useGardenStore((s) => s.harvestAllFlowering);
  const addParticles = useGardenStore((s) => s.addParticles);
  const btnRef = useRef<HTMLButtonElement>(null);

  const stats = useMemo(() => {
    const plantedPlants = plants.filter((p): p is Plant => p !== null);
    const totalPlanted = plantedPlants.length;
    const floweringCount = plantedPlants.filter((p) => p.stage === 'flowering').length;
    const avgHealth = plantedPlants.length > 0
      ? Math.round(plantedPlants.reduce((sum, p) => sum + p.health, 0) / plantedPlants.length)
      : 0;
    const avgGrowth = plantedPlants.length > 0
      ? Math.round(plantedPlants.reduce((sum, p) => sum + p.growth, 0) / plantedPlants.length)
      : 0;
    
    return { totalPlanted, floweringCount, avgHealth, avgGrowth };
  }, [plants]);

  const handleHarvestAll = () => {
    if (stats.floweringCount === 0) return;
    
    const rect = btnRef.current?.getBoundingClientRect();
    const panel = btnRef.current?.closest('.stats-panel')?.getBoundingClientRect();
    if (rect && panel) {
      const x = rect.left - panel.left + rect.width / 2;
      const y = rect.top - panel.top + rect.height / 2;
      addParticles(x, y, 20, '#FF6B6B');
      setTimeout(() => addParticles(x, y, 15, '#FFD93D'), 100);
    }
    
    harvestAllFlowering();
  };

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.avgHealth / 100) * circumference;

  return (
    <div className="stats-panel">
      <div className="panel-header">
        <span className="header-icon">📊</span>
        <span className="header-title">花园统计</span>
      </div>

      <div className="stat-block weather-block">
        <div className="stat-label">当前天气</div>
        <div className="weather-display">
          <span className="weather-big-icon">{WEATHER_ICONS[weather.type]}</span>
          <div className="weather-text">
            <span className="weather-name">{WEATHER_NAMES[weather.type]}</span>
            <span className="weather-temp">{weather.temperature}°C</span>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-item-box">
          <div className="stat-value">{stats.totalPlanted}</div>
          <div className="stat-label">种植总数</div>
        </div>
        <div className="stat-item-box">
          <div className="stat-value highlight">{stats.floweringCount}</div>
          <div className="stat-label">开花中</div>
        </div>
        <div className="stat-item-box">
          <div className="stat-value">{harvestedCount}</div>
          <div className="stat-label">已收获</div>
        </div>
        <div className="stat-item-box">
          <div className="stat-value">{stats.avgGrowth}%</div>
          <div className="stat-label">平均生长</div>
        </div>
      </div>

      <div className="health-section">
        <div className="stat-label">平均健康度</div>
        <div className="health-ring-container">
          <svg className="health-ring" width="60" height="60">
            <circle
              className="ring-bg"
              cx="30"
              cy="30"
              r={radius}
              strokeWidth="6"
              fill="none"
            />
            <circle
              className="ring-progress"
              cx="30"
              cy="30"
              r={radius}
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
              style={{
                stroke: stats.avgHealth >= 60 ? '#4ECDC4' : stats.avgHealth >= 30 ? '#FFD93D' : '#FF6B6B'
              }}
            />
          </svg>
          <div className="health-value">{stats.avgHealth}%</div>
        </div>
      </div>

      <button
        ref={btnRef}
        className={`harvest-all-btn ${stats.floweringCount > 0 ? 'active' : 'disabled'}`}
        onClick={handleHarvestAll}
        disabled={stats.floweringCount === 0}
      >
        <span className="btn-icon">🌾</span>
        <span className="btn-text">
          {stats.floweringCount > 0 
            ? `一键收获 (${stats.floweringCount})` 
            : '暂无可收获'}
        </span>
      </button>
    </div>
  );
};

export default StatsPanel;
