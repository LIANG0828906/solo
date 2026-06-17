import React, { useEffect, useState, useMemo } from 'react';
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

const RING_COLORS: Record<WeatherType, string> = {
  sunny: '#FFD700',
  cloudy: '#B0B0B0',
  rainy: '#4A90D9',
  snowy: '#87CEEB'
};

const TOOLTIP_TEXTS: Record<string, string> = {
  湿度: '空气中水蒸气的含量，越高感觉越闷热',
  风速: '单位时间内空气流动的速度',
  降水概率: '未来出现降雨或降雪的可能性'
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
        <RingDataItem
          label="湿度"
          value={`${displayWeather.humidity}%`}
          percent={displayWeather.humidity}
          type={type}
          tooltip={TOOLTIP_TEXTS['湿度']}
        />
        <RingDataItem
          label="风速"
          value={`${displayWeather.windSpeed} km/h`}
          percent={Math.min(100, (displayWeather.windSpeed / 50) * 100)}
          type={type}
          tooltip={TOOLTIP_TEXTS['风速']}
        />
        <RingDataItem
          label="降水概率"
          value={`${displayWeather.precipitationChance}%`}
          percent={displayWeather.precipitationChance}
          type={type}
          tooltip={TOOLTIP_TEXTS['降水概率']}
        />
      </div>
    </div>
  );
};

interface RingDataItemProps {
  label: string;
  value: string;
  percent: number;
  type: WeatherType;
  tooltip?: string;
}

const RingDataItem: React.FC<RingDataItemProps> = ({ label, value, percent, type, tooltip }) => {
  const [displayPercent, setDisplayPercent] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 300;
    const from = displayPercent;
    const to = percent;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPercent(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent]);

  const color = RING_COLORS[type];

  const ringSize = 40;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - displayPercent / 100);

  return (
    <div
      className="ring-data-item"
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="ring-data-label">{label}</span>
      <div className="ring-data-right">
        <span className="ring-data-value">{value}</span>
        <svg
          width={ringSize}
          height={ringSize}
          className="ring-progress"
          viewBox={`0 0 ${ringSize} ${ringSize}`}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            style={{ transition: 'stroke 0.3s ease' }}
          />
        </svg>
      </div>
      {tooltip && (
        <div className={`data-tooltip ${showTooltip ? 'visible' : ''}`}>
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default InfoCard;
