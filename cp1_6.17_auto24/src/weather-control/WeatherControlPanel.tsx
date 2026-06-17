import React, { useEffect } from 'react';
import {
  useWeatherStore,
  WeatherType,
  weatherLabels,
  weatherButtonColors
} from './weatherStore';
import { playWeatherSound } from '../audio-manager/ambientSound';
import './WeatherControlPanel.css';

const PixelSunIcon: React.FC = () => (
  <div className="pixel-icon pixel-sun-icon">
    <div className="px-sun-core" />
    <div className="px-sun-ray px-sun-ray-t" />
    <div className="px-sun-ray px-sun-ray-r" />
    <div className="px-sun-ray px-sun-ray-b" />
    <div className="px-sun-ray px-sun-ray-l" />
  </div>
);

const PixelRainIcon: React.FC = () => (
  <div className="pixel-icon pixel-rain-icon">
    <div className="px-cloud" />
    <div className="px-rain-drop px-rain-1" />
    <div className="px-rain-drop px-rain-2" />
    <div className="px-rain-drop px-rain-3" />
  </div>
);

const PixelSnowIcon: React.FC = () => (
  <div className="pixel-icon pixel-snow-icon">
    <div className="px-snowflake" />
    <div className="px-snowflake px-snowflake-2" />
    <div className="px-snowflake px-snowflake-3" />
  </div>
);

const PixelStormIcon: React.FC = () => (
  <div className="pixel-icon pixel-storm-icon">
    <div className="px-cloud px-storm-cloud" />
    <div className="px-lightning-bolt" />
    <div className="px-rain-drop px-storm-rain-1" />
    <div className="px-rain-drop px-storm-rain-2" />
  </div>
);

const weatherIcons: Record<WeatherType, React.FC> = {
  [WeatherType.SUNNY]: PixelSunIcon,
  [WeatherType.RAINY]: PixelRainIcon,
  [WeatherType.SNOWY]: PixelSnowIcon,
  [WeatherType.STORMY]: PixelStormIcon
};

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
      {weatherTypes.map((weather) => {
        const IconComponent = weatherIcons[weather];
        return (
          <button
            key={weather}
            className={`weather-btn ${currentWeather === weather ? 'active' : ''}`}
            style={{
              '--button-color': weatherButtonColors[weather]
            } as React.CSSProperties}
            onClick={() => handleWeatherChange(weather)}
          >
            <IconComponent />
            <span className="weather-btn-label">{weatherLabels[weather]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default WeatherControlPanel;
