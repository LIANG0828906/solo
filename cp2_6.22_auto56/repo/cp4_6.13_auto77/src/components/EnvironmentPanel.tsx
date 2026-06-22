import { useGardenStore } from '../GardenStore';
import './EnvironmentPanel.css';

const EnvironmentPanel = () => {
  const environment = useGardenStore((state) => state.environment);
  const setEnvironment = useGardenStore((state) => state.setEnvironment);

  const sliders = [
    {
      key: 'light' as const,
      label: '光照',
      emoji: '☀️',
      gradient: 'linear-gradient(to right, #8b7d3c, #f5d78e, #fff5cc)',
      value: environment.light
    },
    {
      key: 'water' as const,
      label: '水分',
      emoji: '💧',
      gradient: 'linear-gradient(to right, #1e5799, #4a90d9, #a8d4f0)',
      value: environment.water
    },
    {
      key: 'nutrients' as const,
      label: '养分',
      emoji: '🌱',
      gradient: 'linear-gradient(to right, #2d5016, #5a8f3c, #9fd67a)',
      value: environment.nutrients
    }
  ];

  return (
    <div className="environment-panel">
      <h2 className="panel-title">🌿 环境参数</h2>
      <div className="sliders-container">
        {sliders.map((slider) => (
          <div key={slider.key} className="slider-item">
            <div className="slider-label">
              <span className="slider-emoji">{slider.emoji}</span>
              <span className="slider-name">{slider.label}</span>
              <span className="slider-value">{Math.round(slider.value)}%</span>
            </div>
            <div className="slider-track-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                value={slider.value}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setEnvironment({ [slider.key]: value });
                }}
                className="custom-slider"
                style={{
                  background: slider.gradient
                }}
              />
              <div
                className="slider-progress"
                style={{
                  width: `${slider.value}%`,
                  background: slider.gradient,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentPanel;
