import React, { useMemo } from 'react';
import { MoodRecord, MOOD_META, MoodType } from '../types';

interface Props {
  record: MoodRecord;
  compact?: boolean;
  onClick?: () => void;
}

function WeatherSVG({ mood }: { mood: MoodType }) {
  const common = { width: 36, height: 36, viewBox: '0 0 48 48' };
  const sunColor = '#FFD54F';
  const cloudColor = '#B0BEC5';
  const rainColor = '#4FC3F7';
  const thunderColor = '#FFF176';
  const fogColor = '#90A4AE';

  switch (mood) {
    case MoodType.HAPPY:
      return (
        <svg {...common} className="weather-svg sun-svg">
          <defs>
            <filter id="sunGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#sunGlow)">
            <circle cx="24" cy="24" r="11" fill={sunColor} className="sun-core" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <line
                key={i}
                x1={24 + Math.cos((angle * Math.PI) / 180) * 13}
                y1={24 + Math.sin((angle * Math.PI) / 180) * 13}
                x2={24 + Math.cos((angle * Math.PI) / 180) * 19}
                y2={24 + Math.sin((angle * Math.PI) / 180) * 19}
                stroke={sunColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="sun-ray"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </g>
        </svg>
      );
    case MoodType.CALM:
      return (
        <svg {...common} className="weather-svg cloud-svg">
          <g className="cloud-group">
            <circle cx="18" cy="28" r="8" fill={cloudColor} opacity="0.9" />
            <circle cx="28" cy="25" r="10" fill={cloudColor} opacity="0.9" />
            <circle cx="34" cy="30" r="7" fill={cloudColor} opacity="0.9" />
            <circle cx="22" cy="22" r="6" fill="#ECEFF1" />
          </g>
          <circle cx="14" cy="16" r="6" fill={sunColor} opacity="0.95" />
        </svg>
      );
    case MoodType.SAD:
      return (
        <svg {...common} className="weather-svg rain-svg">
          <g className="cloud-group">
            <circle cx="18" cy="18" r="7" fill={cloudColor} opacity="0.85" />
            <circle cx="27" cy="15" r="9" fill={cloudColor} opacity="0.85" />
            <circle cx="34" cy="20" r="6" fill={cloudColor} opacity="0.85" />
          </g>
          <g className="rain-group">
            {[16, 24, 32].map((x, i) => (
              <line
                key={i}
                x1={x}
                y1="28"
                x2={x - 3}
                y2="38"
                stroke={rainColor}
                strokeWidth="2"
                strokeLinecap="round"
                className="rain-drop"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </g>
        </svg>
      );
    case MoodType.ANGRY:
      return (
        <svg {...common} className="weather-svg thunder-svg">
          <g className="cloud-group">
            <circle cx="18" cy="18" r="7" fill="#546E7A" opacity="0.9" />
            <circle cx="27" cy="15" r="9" fill="#455A64" opacity="0.9" />
            <circle cx="34" cy="20" r="6" fill="#546E7A" opacity="0.9" />
          </g>
          <g className="thunder-group">
            <polygon
              points="24,25 22,33 27,33 24,43 32,28 26,28 28,22"
              fill={thunderColor}
              className="thunder-bolt"
            />
          </g>
          <line x1="20" y1="38" x2="17" y2="44" stroke={rainColor} strokeWidth="1.5" strokeLinecap="round" className="rain-drop" />
          <line x1="30" y1="38" x2="27" y2="44" stroke={rainColor} strokeWidth="1.5" strokeLinecap="round" className="rain-drop" style={{ animationDelay: '0.1s' }} />
        </svg>
      );
    case MoodType.ANXIOUS:
      return (
        <svg {...common} className="weather-svg fog-svg">
          <circle cx="24" cy="18" r="5" fill={fogColor} opacity="0.6" />
          <rect x="8" y="24" width="32" height="4" rx="2" fill={fogColor} opacity="0.5" className="fog-line" />
          <rect x="10" y="32" width="28" height="3" rx="1.5" fill={fogColor} opacity="0.4" className="fog-line" style={{ animationDelay: '0.1s' }} />
          <rect x="6" y="39" width="36" height="3" rx="1.5" fill={fogColor} opacity="0.3" className="fog-line" style={{ animationDelay: '0.2s' }} />
        </svg>
      );
    case MoodType.TIRED:
      return (
        <svg {...common} className="weather-svg overcast-svg">
          <g className="cloud-group overcast">
            <circle cx="14" cy="22" r="6" fill={cloudColor} opacity="0.7" />
            <circle cx="22" cy="18" r="8" fill={cloudColor} opacity="0.75" />
            <circle cx="32" cy="20" r="7" fill={cloudColor} opacity="0.7" />
            <circle cx="38" cy="24" r="5" fill={cloudColor} opacity="0.65" />
            <circle cx="18" cy="26" r="5" fill={cloudColor} opacity="0.7" />
            <circle cx="28" cy="26" r="6" fill={cloudColor} opacity="0.7" />
          </g>
        </svg>
      );
    default:
      return null;
  }
}

export default function EmotionCard({ record, compact, onClick }: Props) {
  const meta = MOOD_META[record.mood];
  const weatherDesc = generateWeatherDesc(record);

  const bgStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${meta.bg} 0%, ${meta.bg}cc 100%)`,
      transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
    [meta.bg]
  );

  return (
    <div
      className={`emotion-card ${compact ? 'compact' : ''} floating-cloud`}
      style={bgStyle}
      onClick={onClick}
    >
      <div className="card-weather-badge">
        <WeatherSVG mood={record.mood} />
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
