import { useEffect } from 'react';
import { useWeatherStore, WeatherType } from './weather-control/weatherStore';
import ParticleCanvas from './particle-renderer/ParticleCanvas';
import WeatherControlPanel from './weather-control/WeatherControlPanel';

export default function App() {
  const { currentWeather, lightningActive } = useWeatherStore();

  useEffect(() => {
    document.body.className = `weather-${currentWeather}`;
  }, [currentWeather]);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {currentWeather === WeatherType.SUNNY && (
        <div className="sun-container">
          <div className="sun"></div>
          <div className="sun-glow"></div>
        </div>
      )}

      {currentWeather === WeatherType.STORMY && (
        <div className={`lightning-overlay ${lightningActive ? 'lightning-active' : ''}`}></div>
      )}

      <ParticleCanvas />
      <WeatherControlPanel />
    </div>
  );
}
