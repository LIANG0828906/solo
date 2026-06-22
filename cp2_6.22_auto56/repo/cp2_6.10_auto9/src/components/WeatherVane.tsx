import { useStore } from '@/store/useStore';
import { WIND_LEVELS, WindLevel } from '@/types';
import './WeatherVane.css';

const WeatherVane = () => {
  const windLevel = useStore((state) => state.windLevel);
  const windDirection = useStore((state) => state.windDirection);
  const isStormActive = useStore((state) => state.isStormActive);

  if (!isStormActive) return null;

  const windConfig = WIND_LEVELS[windLevel as WindLevel] || WIND_LEVELS[0];

  return (
    <div className="weathervane-container">
      <div className="weathervane-title">风向标</div>
      <div className="weathervane-dial">
        <div className="weathervane-compass">
          <span className="compass-n">N</span>
          <span className="compass-e">E</span>
          <span className="compass-s">S</span>
          <span className="compass-w">W</span>
          <div 
            className="weathervane-needle"
            style={{ transform: `rotate(${windDirection}deg)` }}
          >
            <div className="needle-head"></div>
            <div className="needle-tail"></div>
          </div>
          <div className="weathervane-center"></div>
        </div>
      </div>
      <div className="weathervane-info">
        <div className="wind-level">
          <span className="wind-label">风级</span>
          <span className="wind-value">{windLevel}级</span>
        </div>
        <div className="wind-name">{windConfig.name}</div>
      </div>
    </div>
  );
};

export default WeatherVane;
