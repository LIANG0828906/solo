import { useEffect, useState } from 'react';
import { useGardenStore } from '../store/gardenStore';
import { WEATHER_ICONS, WEATHER_NAMES, generateWeather } from '../api/weatherApi';
import type { WeatherType } from '../types';
import './WeatherPanel.css';

const WeatherPanel = () => {
  const weather = useGardenStore((s) => s.weather);
  const setWeather = useGardenStore((s) => s.setWeather);
  const weatherTransition = useGardenStore((s) => s.weatherTransition);
  const triggerWeatherTransition = useGardenStore((s) => s.triggerWeatherTransition);
  const completeWeatherTransition = useGardenStore((s) => s.completeWeatherTransition);
  const [prevWeather, setPrevWeather] = useState<WeatherType | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newWeather = generateWeather();
      const oldType = weather.type;
      setPrevWeather(oldType);
      triggerWeatherTransition(oldType, newWeather.type);
      
      setTimeout(() => {
        setWeather(newWeather);
        completeWeatherTransition();
        setPrevWeather(null);
      }, 1000);
    }, 30000);

    return () => clearInterval(interval);
  }, [weather.type, setWeather, triggerWeatherTransition, completeWeatherTransition]);

  const displayIcon = weatherTransition.isActive && weatherTransition.to 
    ? weatherTransition.to 
    : weather.type;
  const displayName = weatherTransition.isActive && weatherTransition.to
    ? WEATHER_NAMES[weatherTransition.to]
    : WEATHER_NAMES[weather.type];

  return (
    <div className="weather-panel">
      <div className="weather-current">
        <div className="weather-icon-container">
          {prevWeather && weatherTransition.isActive && (
            <span className="weather-icon weather-icon-old">
              {WEATHER_ICONS[prevWeather]}
            </span>
          )}
          <span 
            className={`weather-icon weather-icon-new ${weatherTransition.isActive ? 'sliding-in' : ''}`}
          >
            {WEATHER_ICONS[displayIcon]}
          </span>
        </div>
        <div className="weather-info">
          <div className="weather-name">{displayName}</div>
          <div className="weather-temp">{weather.temperature}°C</div>
        </div>
      </div>
      <div className="weather-details">
        <div className="weather-detail">
          <span className="detail-icon">💧</span>
          <span className="detail-value">{weather.humidity}%</span>
        </div>
      </div>
      <div className="weather-forecast">
        <div className="forecast-title">天气预测</div>
        <div className="forecast-icons">
          {weather.forecast.map((w, i) => (
            <div key={i} className="forecast-item">
              <span className="forecast-icon">{WEATHER_ICONS[w]}</span>
              <span className="forecast-label">{i === 0 ? '下1时' : `${i + 1}时`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
