import React from 'react';
import { MoodRecord, MOOD_META } from '../types';

interface Props {
  record: MoodRecord;
  compact?: boolean;
  onClick?: () => void;
}

export default function EmotionCard({ record, compact, onClick }: Props) {
  const meta = MOOD_META[record.mood];
  const weatherDesc = generateWeatherDesc(record);

  return (
    <div
      className={`emotion-card ${compact ? 'compact' : ''}`}
      style={{ background: meta.bg }}
      onClick={onClick}
    >
      <div className="card-weather-badge">
        <span className="weather-icon-anim">{meta.weatherIcon}</span>
        <span className="weather-label">{weatherDesc}</span>
      </div>
      <div className="card-mood-display">
        <span className="card-emoji">{meta.emoji}</span>
      </div>
      {!compact && (
        <>
          <div className="card-text">{record.text}</div>
          <div className="card-date">{record.date}</div>
        </>
      )}
      {compact && <div className="card-date-compact">{record.date.slice(5)}</div>}
      <div className="cloud-decoration cloud-left" />
      <div className="cloud-decoration cloud-right" />
    </div>
  );
}

function generateWeatherDesc(record: MoodRecord): string {
  const meta = MOOD_META[record.mood];
  const intensity = record.intensity;
  if (record.mood === 'happy') {
    return intensity > 0.7 ? '晴空万里' : '多云转晴';
  }
  if (record.mood === 'calm') {
    return '多云';
  }
  if (record.mood === 'sad') {
    return intensity > 0.5 ? '中雨' : '小雨转多云';
  }
  if (record.mood === 'angry') {
    return intensity > 0.6 ? '雷暴' : '雷阵雨';
  }
  if (record.mood === 'anxious') {
    return intensity > 0.6 ? '浓雾' : '薄雾';
  }
  if (record.mood === 'tired') {
    return intensity > 0.5 ? '阴天' : '阴转多云';
  }
  return meta.weather;
}
