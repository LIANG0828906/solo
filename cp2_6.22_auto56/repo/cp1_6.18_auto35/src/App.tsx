import { useEffect } from 'react';
import { useGardenStore } from './store/gardenStore';
import WeatherPanel from './components/WeatherPanel';
import GardenGrid from './components/GardenGrid';
import StatsPanel from './components/StatsPanel';
import SeedDrawer from './components/SeedDrawer';
import type { WeatherType } from './types';
import './App.css';

const WEATHER_BG_MODIFIERS: Record<WeatherType, { saturate: string; brightness: string; hue: string }> = {
  sunny: { saturate: '1.05', brightness: '1.02', hue: '5deg' },
  cloudy: { saturate: '1', brightness: '1', hue: '0deg' },
  overcast: { saturate: '0.95', brightness: '0.98', hue: '-5deg' },
  rainy: { saturate: '0.95', brightness: '1.05', hue: '-10deg' },
  snowy: { saturate: '0.9', brightness: '1.08', hue: '-15deg' }
};

function App() {
  const weather = useGardenStore((s) => s.weather);
  const tick = useGardenStore((s) => s.tick);
  const weatherTransition = useGardenStore((s) => s.weatherTransition);

  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;
      tick(delta);
    }, 100);

    return () => clearInterval(interval);
  }, [tick]);

  const displayWeather = weatherTransition.isActive && weatherTransition.to
    ? weatherTransition.to
    : weather.type;
  const bgModifier = WEATHER_BG_MODIFIERS[displayWeather];

  return (
    <div 
      className="app-container"
      style={{
        filter: `saturate(${bgModifier.saturate}) brightness(${bgModifier.brightness}) hue-rotate(${bgModifier.hue})`,
        transition: 'filter 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="app-bg-gradient" />
      
      <header className="app-header">
        <div className="app-title">
          <span className="title-emoji">🌸</span>
          <h1>气象花园</h1>
          <span className="title-subtitle">Meteorological Garden</span>
        </div>
        <div className="header-weather">
          <WeatherPanel />
        </div>
      </header>

      <main className="app-main">
        <aside className="left-panel">
          <SeedDrawer />
        </aside>

        <section className="center-panel">
          <GardenGrid />
        </section>

        <aside className="right-panel">
          <StatsPanel />
        </aside>
      </main>

      <footer className="app-footer">
        <div className="footer-tips">
          <span>💡 提示：天气每30秒变化一次，雨天植物生长+20%，雪天-30%</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
