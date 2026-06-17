import React, { useEffect, useRef, useState } from 'react';
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

const RING_SIZE = 40;
const RING_STROKE_WIDTH = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const WIND_SPEED_MAX = 50;

function clampPercent(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function windSpeedToPercent(windSpeed: number): number {
  if (windSpeed <= 0) return 0;
  if (windSpeed >= WIND_SPEED_MAX) return 100;
  return clampPercent((windSpeed / WIND_SPEED_MAX) * 100);
}

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
          percent={clampPercent(displayWeather.humidity)}
          type={type}
          tooltip={TOOLTIP_TEXTS['湿度']}
        />
        <RingDataItem
          label="风速"
          value={`${displayWeather.windSpeed} km/h`}
          percent={windSpeedToPercent(displayWeather.windSpeed)}
          type={type}
          tooltip={TOOLTIP_TEXTS['风速']}
        />
        <RingDataItem
          label="降水概率"
          value={`${displayWeather.precipitationChance}%`}
          percent={clampPercent(displayWeather.precipitationChance)}
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
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const isTouchInteractingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const color = RING_COLORS[type];
  const safePercent = clampPercent(percent);
  const dashOffset = RING_CIRCUMFERENCE * (1 - safePercent / 100);

  const clearTooltipTimer = () => {
    if (tooltipTimeoutRef.current !== null) {
      window.clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!tooltip || !showTooltip) return;
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('touchstart', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('touchstart', handleGlobalClick, true);
    };
  }, [tooltip, showTooltip]);

  const hideTooltipWithDelay = () => {
    clearTooltipTimer();
    tooltipTimeoutRef.current = window.setTimeout(() => {
      setShowTooltip(false);
      tooltipTimeoutRef.current = null;
    }, 150);
  };

  const toggleTooltip = () => {
    clearTooltipTimer();
    setShowTooltip(prev => !prev);
  };

  const showTooltipNow = () => {
    clearTooltipTimer();
    if (tooltip) setShowTooltip(true);
  };

  const handleMouseEnter = () => {
    if (isTouchInteractingRef.current) return;
    showTooltipNow();
  };

  const handleMouseLeave = () => {
    if (isTouchInteractingRef.current) return;
    hideTooltipWithDelay();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isTouchInteractingRef.current) {
      isTouchInteractingRef.current = false;
      return;
    }
    if (!tooltip) return;
    e.stopPropagation();
    toggleTooltip();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!tooltip) return;
    e.stopPropagation();
    isTouchInteractingRef.current = true;
    toggleTooltip();
  };

  return (
    <div
      ref={containerRef}
      className="ring-data-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      role={tooltip ? 'button' : undefined}
      tabIndex={tooltip ? 0 : undefined}
      onKeyDown={e => {
        if (!tooltip) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTooltip();
        }
      }}
    >
      <span className="ring-data-label">{label}</span>
      <div className="ring-data-right">
        <span className="ring-data-value">{value}</span>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="ring-progress"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          aria-hidden="true"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={RING_STROKE_WIDTH}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={RING_STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            className="ring-progress-fill"
          />
        </svg>
      </div>
      {tooltip && (
        <div
          className="data-tooltip"
          role="tooltip"
          style={{
            opacity: showTooltip ? 1 : 0,
            transform: showTooltip
              ? 'translateX(-50%) translateY(0)'
              : 'translateX(-50%) translateY(4px)'
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default InfoCard;
