import React from 'react';
import { useWeatherStore, WeatherType, weatherColors } from './weather-control/weatherStore';
import WeatherControlPanel from './weather-control/WeatherControlPanel';
import ParticleCanvas from './particle-renderer/ParticleCanvas';
import './App.css';

const App: React.FC = () => {
  const { currentWeather } = useWeatherStore();

  const bgColor = weatherColors[currentWeather];
  const isSunny = currentWeather === WeatherType.SUNNY;

  return (
    <div
      className="app-container"
      style={{
        backgroundColor: bgColor,
        transition: 'background-color 1s ease'
      }}
    >
      <div className="pixel-border" />

      {isSunny && (
        <div className="sun-container">
          <div className="sun" />
          <div className="sun-glow" />
        </div>
      )}

      <ParticleCanvas />

      <div className="scene-info">
        <h1 className="game-title">像素天气系统</h1>
        <p className="game-subtitle">PIXEL WEATHER SYSTEM</p>
      </div>

      <WeatherControlPanel />
    </div>
  );
};

export default App;
