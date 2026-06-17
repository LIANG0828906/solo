import React, { useEffect } from 'react';
import {
  useWeatherStore,
  WeatherType,
  weatherLabels,
  weatherButtonColors
} from './weatherStore';
import { playWeatherSound } from '../audio-manager/ambientSound';
import './WeatherControlPanel.css';

const WeatherControlPanel: React.FC = () => {
  const { currentWeather, setWeather } = useWeatherStore();

  const handleWeatherChange = (weather: WeatherType) => {
    setWeather(weather);
    playWeatherSound(weather);
  };

  useEffect(() => {
    playWeatherSound(currentWeather);
  }, []);

  const weatherTypes = [
    WeatherType.SUNNY,
    WeatherType.RAINY,
    WeatherType.SNOWY,
    WeatherType.STORMY
  ];

  return (
    <div className="weather-control-panel">
      {weatherTypes.map((weather) => (
        <button
          key={weather}
          className={`weather-btn ${currentWeather === weather ? 'active' : ''}`}
          style={{
            '--button-color': weatherButtonColors[weather]
          } as React.CSSProperties}
          onClick={() => handleWeatherChange(weather)}
        >
          {weatherLabels[weather]}
        </button>
      ))}
    </div>
  );
};

export default WeatherControlPanel;
