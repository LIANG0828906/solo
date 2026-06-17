import WeatherControlPanel from './weather-control/WeatherControlPanel';
import ParticleCanvas from './particle-renderer/ParticleCanvas';
import { useWeatherStore, Weather, WEATHER_COLORS } from './weather-control/weatherStore';
import './index.css';

export default function App() {
  const weather = useWeatherStore((s) => s.weather);
  const bgColor = WEATHER_COLORS[weather];

  return (
    <div className="app-root" style={{ backgroundColor: bgColor }}>
      {weather === Weather.Sunny && (
        <div className="sun-container">
          <div className="sun-core" />
          <div className="sun-glow" />
        </div>
      )}
      <ParticleCanvas />
      <WeatherControlPanel />
    </div>
  );
}
