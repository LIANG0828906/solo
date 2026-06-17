import { useWeatherStore } from './weather-control/weatherStore';
import { WeatherType } from './weather-control/weatherTypes';
import { playWeatherSound } from './audio-manager/ambientSound';
import ParticleCanvas from './particle-renderer/ParticleCanvas';
import { getBackgroundForWeather } from './particle-renderer/particleUtils';

import { useState } from 'react';

const WEATHER_BUTTONS: { type: WeatherType; label: string; color: string }[] = [
  { type: WeatherType.Sunny, label: '☀ Sunny', color: '#FFD700' },
  { type: WeatherType.Rainy, label: '🌧 Rain', color: '#4682B4' },
  { type: WeatherType.Snowy, label: '❄ Snow', color: '#FFFFFF' },
  { type: WeatherType.Stormy, label: '⚡ Storm', color: '#8B008B' },
];

export default function App() {
  const { weather, setWeather } = useWeatherStore();
  const [animatingBtn, setAnimatingBtn] = useState<WeatherType | null>(null);

  const handleWeatherChange = (w: WeatherType) => {
    if (w === weather) return;
    setAnimatingBtn(w);
    setWeather(w);
    playWeatherSound(w);
    setTimeout(() => setAnimatingBtn(null), 150);
  };

  const bgColor = getBackgroundForWeather(weather);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bgColor,
        transition: 'background-color 1s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, position: 'relative' }}>
        <ParticleCanvas />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          backgroundColor: 'rgba(44, 44, 44, 0.85)',
          borderRadius: 12,
          padding: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {WEATHER_BUTTONS.map(({ type, label, color }) => {
          const isActive = weather === type;
          const isAnimating = animatingBtn === type;
          return (
            <button
              key={type}
              onClick={() => handleWeatherChange(type)}
              style={{
                width: 90,
                height: 40,
                borderRadius: 8,
                border: 'none',
                color: '#FFFFFF',
                fontSize: 16,
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                cursor: 'pointer',
                backgroundColor: isActive ? color : 'rgba(60,60,60,0.8)',
                transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
                transition: isAnimating
                  ? 'transform 0.15s ease, background-color 0.3s ease'
                  : 'transform 0.15s ease, background-color 0.3s ease',
                textShadow: isActive ? '0 0 6px rgba(0,0,0,0.5)' : 'none',
                boxShadow: isActive ? `0 0 10px ${color}66` : 'none',
                letterSpacing: 0.5,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <style>{`
        @media (max-width: 600px) {
          button { width: 70px !important; font-size: 14px !important; }
        }
      `}</style>
    </div>
  );
}
