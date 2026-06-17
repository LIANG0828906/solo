import React, { useEffect, useState } from 'react';
import { WeatherData, WeatherType } from '../weatherEngine';

interface InfoCardProps {
  weather: WeatherData | null;
  useCelsius: boolean;
  visible: boolean;
}

const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '雨天',
  snowy: '雪天'
};

const InfoCard: React.FC<InfoCardProps> = ({ weather, useCelsius, visible }) => {
  const [fadeKey, setFadeKey] = useState(0);
  const [displayWeather, setDisplayWeather] = useState<WeatherData | null>(weather);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!weather) return;
    if (!displayWeather || displayWeather.id !== weather.id) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setDisplayWeather(weather);
        setIsFading(false);
        setFadeKey(k => k + 1);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [weather, displayWeather]);

  if (!visible || !displayWeather) return null;

  const temperature = useCelsius ? displayWeather.temperatureC : displayWeather.temperatureF;
  const unit = useCelsius ? '°C' : '°F';
  const type = displayWeather.type;

  return (
    <div
      className={`info-card ${isFading ? 'fade-out' : 'fade-in'}`}
      key={`card-${fadeKey}`}
    >
      <div className="info-card-header">
        <div>
          <div className="city-name">{displayWeather.city}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {WEATHER_LABELS[type]}
          </div>
        </div>
        <div className="weather-icon" aria-hidden="true">
          {displayWeather.icon}
        </div>
      </div>

      <div className="temperature">
        {temperature}
        <span style={{ fontSize: 18, fontWeight: 400, marginLeft: 4, opacity: 0.85 }}>
          {unit}
        </span>
      </div>

      <div className="data-list">
        <DataItem
          label="湿度"
          value={`${displayWeather.humidity}%`}
          percent={displayWeather.humidity}
          type={type}
        />
        <DataItem
          label="风速"
          value={`${displayWeather.windSpeed} km/h`}
          percent={Math.min(100, (displayWeather.windSpeed / 40) * 100)}
          type={type}
        />
        <DataItem
          label="降水概率"
          value={`${displayWeather.precipitationChance}%`}
          percent={displayWeather.precipitationChance}
          type={type}
        />
      </div>
    </div>
  );
};

interface DataItemProps {
  label: string;
  value: string;
  percent: number;
  type: WeatherType;
}

const DataItem: React.FC<DataItemProps> = ({ label, value, percent, type }) => {
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 600;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPercent(percent * eased);
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  return (
    <div className="data-item">
      <div className="data-item-label">
        <span>{label}</span>
        <span className="data-item-value">{value}</span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${type}`}
          style={{ width: `${Math.max(0, Math.min(100, displayPercent))}%` }}
        />
      </div>
    </div>
  );
};

export default InfoCard;
