import React from 'react';
import { useRouteStore } from '../store/useRouteStore';

const weatherEmojis: Record<string, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  snowy: '❄️',
  foggy: '🌫️',
  windy: '💨',
};

const WeatherCard: React.FC = () => {
  const weatherData = useRouteStore((state) => state.weatherData);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #64B5F6 0%, #ffffff 100%)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        gap: 12,
        justifyContent: 'space-between',
      }}
    >
      {weatherData.map((day, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '12px 8px',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 8,
            backdropFilter: 'blur(4px)',
          }}
        >
          <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>{day.date}</span>
          <span style={{ fontSize: 32 }}>{weatherEmojis[day.condition] || '🌤️'}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
              {day.tempHigh}°
            </span>
            <span style={{ fontSize: 12, color: '#999' }}>{day.tempLow}°</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12 }}>💧</span>
            <span style={{ fontSize: 11, color: '#666' }}>{day.rainProbability}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeatherCard;
