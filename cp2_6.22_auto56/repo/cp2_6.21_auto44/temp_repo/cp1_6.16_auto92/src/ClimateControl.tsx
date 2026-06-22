import React from 'react';
import { PlantType, ClimateParams, WeatherType } from './PlantManager';

interface ClimateControlProps {
  climate: ClimateParams;
  onClimateChange: (params: ClimateParams) => void;
  weather: WeatherType;
  selectedPlantType: PlantType | null;
  onSelectPlantType: (type: PlantType | null) => void;
  onWaterAll: () => void;
}

const WeatherIcon: React.FC<{ weather: WeatherType }> = ({ weather }) => {
  const time = React.useRef(0);
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  React.useEffect(() => {
    let animId: number;
    const tick = () => {
      time.current += 0.03;
      forceUpdate();
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const t = time.current;

  if (weather === 'sunny') {
    return (
      <svg width="60" height="60" viewBox="0 0 60 60">
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF176" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#FFC107" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF9800" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="30" cy="30" r="28" fill="url(#sunGlow)" opacity={0.6 + Math.sin(t * 2) * 0.2} />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2 + t * 0.5;
          const innerR = 16;
          const outerR = 24 + Math.sin(t * 3 + i) * 2;
          return (
            <line
              key={i}
              x1={30 + Math.cos(angle) * innerR}
              y1={30 + Math.sin(angle) * innerR}
              x2={30 + Math.cos(angle) * outerR}
              y2={30 + Math.sin(angle) * outerR}
              stroke="#FFC107"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.7 + Math.sin(t * 2 + i * 0.5) * 0.3}
            />
          );
        })}
        <circle cx="30" cy="30" r="12" fill="#FFD54F" />
        <circle cx="30" cy="30" r="9" fill="#FFEB3B" />
      </svg>
    );
  }

  if (weather === 'cloudy') {
    const sway = Math.sin(t) * 3;
    return (
      <svg width="60" height="60" viewBox="0 0 60 60">
        <g transform={`translate(${sway}, 0)`}>
          <ellipse cx="30" cy="28" rx="20" ry="12" fill="#90A4AE" opacity="0.9" />
          <ellipse cx="22" cy="24" rx="12" ry="10" fill="#B0BEC5" opacity="0.85" />
          <ellipse cx="38" cy="25" rx="14" ry="10" fill="#B0BEC5" opacity="0.85" />
          <ellipse cx="30" cy="22" rx="14" ry="10" fill="#CFD8DC" opacity="0.8" />
        </g>
      </svg>
    );
  }

  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <ellipse cx="30" cy="20" rx="18" ry="10" fill="#5C6BC0" opacity="0.9" />
      <ellipse cx="22" cy="17" rx="10" ry="8" fill="#7986CB" opacity="0.85" />
      <ellipse cx="38" cy="18" rx="12" ry="8" fill="#7986CB" opacity="0.85" />
      <ellipse cx="30" cy="15" rx="12" ry="8" fill="#9FA8DA" opacity="0.8" />
      {Array.from({ length: 5 }).map((_, i) => {
        const x = 16 + i * 8;
        const y = 32 + ((t * 40 + i * 15) % 25);
        const opacity = 1 - ((t * 40 + i * 15) % 25) / 25;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x - 1}
            y2={y + 6}
            stroke="#42A5F5"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};

const getTemperaturePanelBg = (temp: number): string => {
  const minT = -5;
  const maxT = 45;
  const t = (temp - minT) / (maxT - minT);
  const r = Math.round(21 + t * (180 - 21));
  const g = Math.round(101 + t * (30 - 101));
  const b = Math.round(192 + t * (20 - 192));
  return `rgba(${r},${g},${b},0.25)`;
};

export const ClimateControl: React.FC<ClimateControlProps> = ({
  climate,
  onClimateChange,
  weather,
  selectedPlantType,
  onSelectPlantType,
  onWaterAll,
}) => {
  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onClimateChange({ ...climate, temperature: Number(e.target.value) });
  };

  const handleHumidityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onClimateChange({ ...climate, humidity: Number(e.target.value) });
  };

  const handleLightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onClimateChange({ ...climate, lightIntensity: Number(e.target.value) });
  };

  const handlePlantSelect = (type: PlantType) => {
    onSelectPlantType(selectedPlantType === type ? null : type);
  };

  const weatherText: Record<WeatherType, string> = {
    sunny: '晴天',
    cloudy: '阴天',
    rainy: '雨天',
  };

  const plantNames: Record<PlantType, string> = {
    [PlantType.Cactus]: '仙人掌',
    [PlantType.Fern]: '蕨类',
    [PlantType.Orchid]: '兰花',
  };

  return (
    <div className="control-panel" style={{ background: getTemperaturePanelBg(climate.temperature) }}>
      <div className="panel-title">气候调控</div>

      <div className="slider-group">
        <div className="slider-label">
          <span>
            <span className="icon">🌡️</span>温度
          </span>
          <span className="value">{climate.temperature}°C</span>
        </div>
        <input
          type="range"
          className="slider-temp"
          min={-5}
          max={45}
          value={climate.temperature}
          onChange={handleTempChange}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#66bb6a' }}>
          <span>-5°C</span>
          <span>45°C</span>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>
            <span className="icon">💧</span>湿度
          </span>
          <span className="value">{climate.humidity}%</span>
        </div>
        <input
          type="range"
          className="slider-humidity"
          min={0}
          max={100}
          value={climate.humidity}
          onChange={handleHumidityChange}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#66bb6a' }}>
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>
            <span className="icon">☀️</span>光照
          </span>
          <span className="value">{climate.lightIntensity} lux</span>
        </div>
        <input
          type="range"
          className="slider-light"
          min={0}
          max={10000}
          step={100}
          value={climate.lightIntensity}
          onChange={handleLightChange}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#66bb6a' }}>
          <span>0</span>
          <span>10000 lux</span>
        </div>
      </div>

      <hr className="section-divider" />

      <div className="weather-section">
        <div className="weather-label">当前天气</div>
        <div className="weather-icon-container">
          <WeatherIcon weather={weather} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#a5d6a7' }}>
          {weatherText[weather]}
        </div>
      </div>

      <hr className="section-divider" />

      <div className="plant-select-label">选择植物</div>
      <div className="plant-buttons">
        {([PlantType.Cactus, PlantType.Fern, PlantType.Orchid] as PlantType[]).map((type) => (
          <button
            key={type}
            className={`plant-btn plant-btn-${type} ${selectedPlantType === type ? 'selected' : ''}`}
            onClick={() => handlePlantSelect(type)}
            title={plantNames[type]}
          >
            {plantNames[type]}
          </button>
        ))}
      </div>

      <button className="water-btn" onClick={onWaterAll}>
        💦 浇水
      </button>
    </div>
  );
};
