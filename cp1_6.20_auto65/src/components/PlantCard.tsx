import { Plant } from '../types';
import { differenceInDays, startOfDay } from 'date-fns';

interface PlantCardProps {
  plant: Plant;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function getPlantStatus(plant: Plant): 'good' | 'warning' | 'danger' {
  const today = startOfDay(new Date());
  
  if (plant.nextWaterDate) {
    const waterDays = differenceInDays(startOfDay(new Date(plant.nextWaterDate)), today);
    if (waterDays < 0) return 'danger';
    if (waterDays <= 1) return 'warning';
  }
  
  if (plant.nextFertilizeDate) {
    const fertilizeDays = differenceInDays(startOfDay(new Date(plant.nextFertilizeDate)), today);
    if (fertilizeDays < 0) return 'danger';
    if (fertilizeDays <= 1) return 'warning';
  }
  
  return 'good';
}

function getStatusClass(status: 'good' | 'warning' | 'danger') {
  switch (status) {
    case 'good': return 'status-good';
    case 'warning': return 'status-warning';
    case 'danger': return 'status-danger';
  }
}

const plantEmojis: Record<string, string> = {
  '多肉': '🌵',
  '绿萝': '🌿',
  '兰花': '🌸',
  '其他': '🪴'
};

export default function PlantCard({ plant, onClick, style }: PlantCardProps) {
  const status = getPlantStatus(plant);
  const emoji = plantEmojis[plant.species] || '🪴';

  return (
    <div 
      className="card plant-card" 
      onClick={onClick}
      style={style}
    >
      <div className="plant-card-image">
        <div className={`status-indicator ${getStatusClass(status)}`}></div>
        {plant.image ? (
          <img src={plant.image} alt={plant.name} />
        ) : (
          <span className="plant-icon">{emoji}</span>
        )}
      </div>
      <div className="plant-card-body">
        <h3 className="plant-card-name">{plant.name}</h3>
        <div className="plant-card-meta">
          <span>🌿 {plant.species}</span>
          <span>📍 {plant.location}</span>
        </div>
      </div>
    </div>
  );
}
