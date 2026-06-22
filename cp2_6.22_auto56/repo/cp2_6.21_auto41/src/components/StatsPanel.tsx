import React, { useRef, useEffect, useState } from 'react';
import {
  useResourceHistory,
  useCityName,
  useShowLevelUpAnimation,
  useGetCityLevel,
  useGrid,
  useResources
} from '../store/gameStore';
import {
  Resources,
  RESOURCE_COLORS,
  RESOURCE_NAMES,
  CITY_LEVEL_NAMES,
  CityLevel,
  HISTORY_LENGTH
} from '../types/gameTypes';
import { countBuildings } from '../core/resourceEngine';
import './StatsPanel.css';

const StatsPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = useResourceHistory();
  const cityName = useCityName();
  const cityLevel = useGetCityLevel();
  const showLevelUp = useShowLevelUpAnimation();
  const grid = useGrid();
  const resources = useResources();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const buildingCounts = countBuildings(grid);

  const getCityLevelThreshold = (level: CityLevel): number => {
    switch (level) {
      case 'village': return 0;
      case 'town': return 200;
      case 'city': return 600;
      case 'metropolis': return 1000;
    }
  };

  const getNextLevel = (level: CityLevel): CityLevel | null => {
    switch (level) {
      case 'village': return 'town';
      case 'town': return 'city';
      case 'city': return 'metropolis';
      case 'metropolis': return null;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 10, right: 10, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * (4 - i);
      const value = Math.round(100 * (i / 4));
      ctx.fillText(`${value}`, padding.left - 5, y + 3);
    }

    const resourceKeys: (keyof Resources)[] = ['population', 'money', 'happiness', 'environment'];

    if (history.length > 0) {
      const maxValues: Record<keyof Resources, number> = {
        population: Math.max(100, ...history.map(h => h.population)),
        money: Math.max(100, ...history.map(h => h.money)),
        happiness: 100,
        environment: 100
      };

      resourceKeys.forEach((key, resourceIndex) => {
        const points: { x: number; y: number }[] = [];
        
        history.forEach((entry, index) => {
          const x = padding.left + (chartWidth / (HISTORY_LENGTH - 1)) * index;
          const normalizedValue = entry[key] / maxValues[key];
          const y = padding.top + chartHeight * (1 - normalizedValue);
          points.push({ x, y });
        });

        if (points.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = RESOURCE_COLORS[key];
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();

          points.forEach((point, index) => {
            ctx.beginPath();
            ctx.fillStyle = RESOURCE_COLORS[key];
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < HISTORY_LENGTH; i++) {
      const x = padding.left + (chartWidth / (HISTORY_LENGTH - 1)) * i;
      ctx.fillText(`${i + 1}`, x, height - 8);
    }

  }, [history]);

  const legendItems: (keyof Resources)[] = ['population', 'money', 'happiness', 'environment'];
  const nextLevel = getNextLevel(cityLevel);
  const currentThreshold = getCityLevelThreshold(cityLevel);
  const nextThreshold = nextLevel ? getCityLevelThreshold(nextLevel) : currentThreshold;
  const progress = nextLevel && nextThreshold > currentThreshold
    ? Math.max(0, Math.min(1, (resources.population - currentThreshold) / (nextThreshold - currentThreshold)))
    : 1;

  return (
    <>
      <button 
        className="stats-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? '📊 展开' : '📊 收起'}
      </button>
      
      <div className={`stats-panel ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="stats-header">
          <h2 className="city-name">{cityName}</h2>
          {showLevelUp && (
            <div className="level-up-effect">
              <div className="gold-ring"></div>
            </div>
          )}
        </div>

        <div className="city-level-section">
          <div className="level-badge">
            <span className="level-icon">🏰</span>
            <span className="level-name">{CITY_LEVEL_NAMES[cityLevel]}</span>
          </div>
          {nextLevel && (
            <div className="level-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
              <span className="progress-text">
                下一级: {CITY_LEVEL_NAMES[nextLevel]} ({nextThreshold}人)
              </span>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3 className="chart-title">资源趋势</h3>
          <canvas
            ref={canvasRef}
            width={280}
            height={180}
            className="trend-chart"
          />
          <div className="chart-legend">
            {legendItems.map(key => (
              <div key={key} className="legend-item">
                <span 
                  className="legend-color"
                  style={{ backgroundColor: RESOURCE_COLORS[key] }}
                />
                <span className="legend-name">{RESOURCE_NAMES[key]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="buildings-stats">
          <h3 className="stats-title">建筑统计</h3>
          <div className="building-counts">
            <div className="building-count-item">
              <span className="building-icon">🏠</span>
              <span className="building-count">{buildingCounts.residential}</span>
            </div>
            <div className="building-count-item">
              <span className="building-icon">🏪</span>
              <span className="building-count">{buildingCounts.commercial}</span>
            </div>
            <div className="building-count-item">
              <span className="building-icon">🏭</span>
              <span className="building-count">{buildingCounts.industrial}</span>
            </div>
            <div className="building-count-item">
              <span className="building-icon">🛤️</span>
              <span className="building-count">{buildingCounts.road}</span>
            </div>
          </div>
        </div>

        <div className="help-section">
          <h3 className="stats-title">操作指南</h3>
          <ul className="help-list">
            <li>🖱️ 点击空地建造建筑</li>
            <li>⌨️ 按住 Shift 快速建造</li>
            <li>🔢 数字键 1-3 切换建筑</li>
            <li>❌ 右键拆除建筑 (退50%)</li>
            <li>⎋ ESC 关闭菜单</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default StatsPanel;
