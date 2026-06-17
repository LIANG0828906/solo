import { useRef } from 'react';
import { useGardenStore } from '../store/gardenStore';
import type { Plant } from '../types';
import { WEATHER_ICONS } from '../api/weatherApi';
import { getHealthColor, getWeatherPlantColorModifier } from '../utils/plantGrowth';
import { PLANT_SPECIES } from '../api/weatherApi';
import './PlantCard.css';

interface PlantCardProps {
  plant: Plant;
  position: number;
}

const PlantCard = ({ plant, position }: PlantCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const weather = useGardenStore((s) => s.weather);
  const waterPlantAt = useGardenStore((s) => s.waterPlantAt);
  const fertilizePlantAt = useGardenStore((s) => s.fertilizePlantAt);
  const addRipple = useGardenStore((s) => s.addRipple);
  const ripples = useGardenStore((s) => s.ripples).filter((r) => r.plantId === plant.id);
  const harvestPlant = useGardenStore((s) => s.harvestPlant);
  const addParticles = useGardenStore((s) => s.addParticles);

  const species = PLANT_SPECIES[plant.species];
  const healthColor = getHealthColor(plant.health);
  const colorModifier = getWeatherPlantColorModifier(weather.type);

  const adjustColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const newR = Math.min(255, Math.round(r * colorModifier.lightness));
    const newG = Math.min(255, Math.round(g * colorModifier.lightness));
    const newB = Math.min(255, Math.round(b * colorModifier.lightness));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  const plantColor = adjustColor(species.color);

  const handleWater = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addRipple(plant.id, x, y, 'water');
    }
    waterPlantAt(position);
  };

  const handleFertilize = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addRipple(plant.id, x, y, 'fertilize');
    }
    fertilizePlantAt(position);
  };

  const handleHarvest = (e: React.MouseEvent) => {
    if (plant.stage !== 'flowering') return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = rect.width / 2;
      const y = rect.height / 2;
      addParticles(x, y, 12, species.color);
    }
    harvestPlant(position);
  };

  const renderPlantVisual = () => {
    switch (plant.stage) {
      case 'seedling':
        return (
          <div className="plant-visual seedling">
            <svg width="40" height="30" viewBox="0 0 40 30">
              <path
                d="M20 30 Q20 20 20 15 Q15 10 10 12 Q15 15 20 15 Q25 10 30 12 Q25 15 20 15"
                fill="#6BCB77"
                className="plant-grow"
              />
              <ellipse cx="20" cy="28" rx="12" ry="2" fill="#3A3A5C" opacity="0.5" />
            </svg>
          </div>
        );
      case 'growing':
        return (
          <div className="plant-visual growing">
            <svg width="50" height="60" viewBox="0 0 50 60">
              <ellipse cx="25" cy="58" rx="16" ry="2" fill="#3A3A5C" opacity="0.5" />
              <rect x="23" y="20" width="4" height="38" rx="2" fill="#4CAF50" />
              <path
                d="M25 40 Q10 35 8 25 Q15 28 25 35"
                fill="#6BCB77"
                className="plant-sway"
              />
              <path
                d="M25 30 Q40 25 42 15 Q35 18 25 25"
                fill="#6BCB77"
                className="plant-sway"
                style={{ animationDelay: '0.15s' }}
              />
              <path
                d="M25 22 Q15 18 12 10 Q18 12 25 18"
                fill="#81C784"
                className="plant-sway"
                style={{ animationDelay: '0.3s' }}
              />
            </svg>
          </div>
        );
      case 'flowering':
        const flowerStyle = { filter: `saturate(${colorModifier.saturation})` };
        return (
          <div className="plant-visual flowering" style={flowerStyle}>
            <svg width="60" height="80" viewBox="0 0 60 80">
              <ellipse cx="30" cy="78" rx="20" ry="3" fill="#3A3A5C" opacity="0.5" />
              <rect x="28" y="30" width="4" height="48" rx="2" fill="#4CAF50" />
              <path d="M30 55 Q15 50 10 40 Q20 43 30 50" fill="#6BCB77" className="plant-sway" />
              <path d="M30 45 Q45 40 50 30 Q40 33 30 40" fill="#6BCB77" className="plant-sway" style={{ animationDelay: '0.2s' }} />
              <g className="flower-head">
                <circle cx="30" cy="22" r="6" fill={plantColor} />
                <ellipse cx="30" cy="10" rx="5" ry="8" fill={plantColor} opacity="0.9" />
                <ellipse cx="42" cy="18" rx="5" ry="8" fill={plantColor} opacity="0.9" transform="rotate(72 30 22)" />
                <ellipse cx="38" cy="32" rx="5" ry="8" fill={plantColor} opacity="0.9" transform="rotate(144 30 22)" />
                <ellipse cx="22" cy="32" rx="5" ry="8" fill={plantColor} opacity="0.9" transform="rotate(216 30 22)" />
                <ellipse cx="18" cy="18" rx="5" ry="8" fill={plantColor} opacity="0.9" transform="rotate(288 30 22)" />
                <circle cx="30" cy="22" r="4" fill="#FFE66D" />
              </g>
            </svg>
          </div>
        );
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`plant-card ${plant.stage === 'flowering' ? 'harvestable' : ''}`}
      onClick={plant.stage === 'flowering' ? handleHarvest : undefined}
    >
      <div 
        className="health-indicator"
        style={{ backgroundColor: healthColor }}
        title={`健康度: ${plant.health}%`}
      />
      
      {renderPlantVisual()}

      <div className="plant-name">{species.name}</div>
      <div className="plant-stage">
        {plant.stage === 'seedling' && '🌱 幼苗'}
        {plant.stage === 'growing' && '🌿 成长'}
        {plant.stage === 'flowering' && '🌸 开花'}
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${plant.growth}%` }}
        />
      </div>

      <div className="stat-bars">
        <div className="stat-bar humidity" title={`湿度: ${Math.round(plant.humidity)}%`}>
          <div className="stat-fill" style={{ width: `${plant.humidity}%` }} />
          <span className="stat-icon">💧</span>
        </div>
        <div className="stat-bar nutrients" title={`养分: ${Math.round(plant.nutrients)}%`}>
          <div className="stat-fill" style={{ width: `${plant.nutrients}%` }} />
          <span className="stat-icon">🌿</span>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="action-btn water-btn"
          onClick={(e) => { e.stopPropagation(); handleWater(e); }}
          title="浇水"
        >
          💧
        </button>
        <button 
          className="action-btn fertilize-btn"
          onClick={(e) => { e.stopPropagation(); handleFertilize(e); }}
          title="施肥"
        >
          🌿
        </button>
      </div>

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={`ripple ${ripple.type}`}
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}

      {plant.stage === 'flowering' && (
        <div className="harvest-hint">点击收获</div>
      )}
    </div>
  );
};

export default PlantCard;
