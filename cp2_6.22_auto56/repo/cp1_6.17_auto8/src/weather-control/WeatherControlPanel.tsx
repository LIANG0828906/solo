import { useState } from 'react';
import { WeatherType, useWeatherStore, weatherConfigs } from './weatherStore';
import { playWeatherSound, stopSound } from '../audio-manager/ambientSound';

const weatherButtons = [
  { type: WeatherType.SUNNY, label: '晴天', emoji: '☀️' },
  { type: WeatherType.RAINY, label: '雨天', emoji: '🌧️' },
  { type: WeatherType.SNOWY, label: '雪天', emoji: '❄️' },
  { type: WeatherType.STORMY, label: '风暴', emoji: '⛈️' },
];

export default function WeatherControlPanel() {
  const { currentWeather, setWeather } = useWeatherStore();
  const [bouncingType, setBouncingType] = useState<WeatherType | null>(null);

  const handleWeatherClick = (weatherType: WeatherType) => {
    setBouncingType(weatherType);
    setTimeout(() => setBouncingType(null), 150);

    stopSound();
    setWeather(weatherType);
    playWeatherSound(weatherType);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        height: '60px',
        backgroundColor: 'rgba(44, 44, 44, 0.85)',
        borderRadius: '12px',
        padding: '10px',
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      {weatherButtons.map(({ type, label, emoji }) => {
        const isActive = currentWeather === type;
        const config = weatherConfigs[type];
        const isBouncing = bouncingType === type;

        return (
          <button
            key={type}
            onClick={() => handleWeatherClick(type)}
            style={{
              width: '90px',
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              color: type === WeatherType.SNOWY && isActive ? '#2C2C2C' : 'white',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: isActive ? config.buttonThemeColor : '#2C2C2C',
              transition: 'transform 0.15s ease, background-color 0.2s ease',
              transform: isBouncing ? 'scale(1.1)' : 'scale(1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: "'Courier New', monospace",
            }}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        );
      })}

      <style>{`
        @media (max-width: 600px) {
          button {
            width: 70px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
