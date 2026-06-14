import React, { memo } from 'react';
import type { Station } from '../types';
import { AQI_LEVELS, POLLUTANT_UNITS } from '../types';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface StationCardProps {
  station: Station;
  index: number;
  progress: number;
  isFiltered: boolean;
  onClick: () => void;
}

export const StationCard = memo(function StationCard({
  station,
  index,
  progress,
  isFiltered,
  onClick,
}: StationCardProps) {
  const levelInfo = AQI_LEVELS[station.level];
  const animatedAqi = useAnimatedNumber(station.aqi);
  const animatedPrimaryValue = useAnimatedNumber(station.pollutants[station.primaryPollutant]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const allPollutants = Object.entries(station.pollutants) as [keyof typeof station.pollutants, number][];

  return (
    <div
      className={`station-card ${isFiltered ? 'filtering-out' : ''}`}
      style={{
        animationDelay: `${index * 0.08}s`,
      }}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-title">
          <h3>{station.name}</h3>
          <p>{station.city}</p>
        </div>
        <div
          className="aqi-badge"
          style={{
            backgroundColor: `${levelInfo.color}20`,
          }}
        >
          <span className="aqi-value" style={{ color: levelInfo.color }}>
            {Math.round(animatedAqi)}
          </span>
          <span className="aqi-label">{levelInfo.label}</span>
        </div>
      </div>

      <div className="card-main">
        <div className="primary-pollutant">
          <span className="primary-pollutant-label">首要污染物</span>
          <span className="primary-pollutant-name">{station.primaryPollutant}</span>
          <span className="primary-pollutant-value">
            {animatedPrimaryValue} {POLLUTANT_UNITS[station.primaryPollutant]}
          </span>
        </div>
      </div>

      <div className="card-preview">
        {allPollutants.slice(0, 6).map(([name, value]) => (
          <div key={name} className="preview-item">
            <span className="preview-item-name">{name}</span>
            <span className="preview-item-value">
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="card-footer">
        <span>更新于 {formatTime(station.updateTime)}</span>
      </div>

      <div className="refresh-progress" style={{ width: `${progress}%` }} />
    </div>
  );
});
