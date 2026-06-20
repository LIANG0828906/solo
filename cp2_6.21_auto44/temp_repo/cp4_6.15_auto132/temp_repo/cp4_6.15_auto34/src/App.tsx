import { useState, useEffect, useCallback } from 'react';
import type { RegionType, WeatherType, WeatherStatus } from './types';
import { REGION_LIST, getRegionConfig, pickWeatherForRegion, getTransitionDuration } from './RegionManager';
import { getWeatherStatus } from './WeatherEngine';
import SceneController from './SceneController';
import PlayerStatusPanel from './PlayerStatusPanel';

function App() {
  const [currentRegion, setCurrentRegion] = useState<RegionType>('forest');
  const [currentWeather, setCurrentWeather] = useState<WeatherType>('rainy');
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>(getWeatherStatus('rainy'));
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const initWeather = pickWeatherForRegion('forest');
    setCurrentWeather(initWeather);
    setWeatherStatus(getWeatherStatus(initWeather));
  }, []);

  const handleRegionChange = useCallback((regionId: RegionType) => {
    if (regionId === currentRegion || isTransitioning) return;

    setIsTransitioning(true);
    const duration = getTransitionDuration(regionId);

    window.setTimeout(() => {
      setCurrentRegion(regionId);
      const newWeather = pickWeatherForRegion(regionId);
      setCurrentWeather(newWeather);
      setWeatherStatus(getWeatherStatus(newWeather));

      window.setTimeout(() => {
        setIsTransitioning(false);
      }, duration / 2);
    }, duration / 2);
  }, [currentRegion, isTransitioning]);

  return (
    <div className="app-container">
      <div className="region-selector">
        {REGION_LIST.map((regionId) => {
          const config = getRegionConfig(regionId);
          const isActive = regionId === currentRegion;
          return (
            <button
              key={regionId}
              className={`region-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleRegionChange(regionId)}
              disabled={isTransitioning}
              aria-pressed={isActive}
            >
              {config.icon} {config.name}
            </button>
          );
        })}
      </div>

      <div className="scene-wrapper">
        <div style={{ position: 'relative', width: '100%', maxWidth: 1400 }}>
          <SceneController
            weather={currentWeather}
            visibility={weatherStatus.visibility}
            transitionDuration={getTransitionDuration(currentRegion)}
          />
          <div className={`overlay-mask ${isTransitioning ? 'active' : ''}`} />
        </div>
      </div>

      <PlayerStatusPanel
        region={currentRegion}
        temperature={weatherStatus.temperature}
        visibility={weatherStatus.visibility}
      />
    </div>
  );
}

export default App;
