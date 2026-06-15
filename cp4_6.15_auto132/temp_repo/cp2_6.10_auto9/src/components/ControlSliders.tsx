import { useStore } from '@/store/useStore';
import './ControlSliders.css';

const ControlSliders = () => {
  const sailAngle = useStore((state) => state.sailAngle);
  const rudderAngle = useStore((state) => state.rudderAngle);
  const ballastWeight = useStore((state) => state.ballastWeight);
  
  const setSailAngle = useStore((state) => state.setSailAngle);
  const setRudderAngle = useStore((state) => state.setRudderAngle);
  const setBallastWeight = useStore((state) => state.setBallastWeight);

  return (
    <div className="sliders-container">
      <div className="slider-group">
        <div className="slider-label">
          <span className="label-icon">
            <i className="fas fa-wind"></i>
          </span>
          <span className="label-text">帆角</span>
          <span className="label-value">{sailAngle.toFixed(0)}°</span>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="90"
            value={sailAngle}
            onChange={(e) => setSailAngle(Number(e.target.value))}
            className="custom-slider"
            style={{
              background: `linear-gradient(to right, #5d3a1a 0%, #8b6f47 ${(sailAngle / 90) * 100}%, #1a2a3a ${(sailAngle / 90) * 100}%, #1a2a3a 100%)`,
            }}
          />
          <div className="slider-thumb" style={{ left: `${(sailAngle / 90) * 100}%` }}>
            <i className="fas fa-anchor"></i>
          </div>
        </div>
        <div className="slider-range">
          <span>0°<br /><small>正横风</small></span>
          <span>90°<br /><small>顺风</small></span>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span className="label-icon">
            <i className="fas fa-ship"></i>
          </span>
          <span className="label-text">舵角</span>
          <span className="label-value">{rudderAngle.toFixed(0)}°</span>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            min="-45"
            max="45"
            value={rudderAngle}
            onChange={(e) => setRudderAngle(Number(e.target.value))}
            className="custom-slider"
            style={{
              background: `linear-gradient(to right, #5d3a1a 0%, #8b6f47 ${((rudderAngle + 45) / 90) * 100}%, #1a2a3a ${((rudderAngle + 45) / 90) * 100}%, #1a2a3a 100%)`,
            }}
          />
          <div className="slider-thumb" style={{ left: `${((rudderAngle + 45) / 90) * 100}%` }}>
            <i className="fas fa-anchor"></i>
          </div>
        </div>
        <div className="slider-range">
          <span>-45°<br /><small>左舵</small></span>
          <span>+45°<br /><small>右舵</small></span>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span className="label-icon">
            <i className="fas fa-weight-hanging"></i>
          </span>
          <span className="label-text">压舱物</span>
          <span className="label-value">{ballastWeight.toFixed(0)}斤</span>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            min="200"
            max="800"
            value={ballastWeight}
            onChange={(e) => setBallastWeight(Number(e.target.value))}
            className="custom-slider"
            style={{
              background: `linear-gradient(to right, #5d3a1a 0%, #8b6f47 ${((ballastWeight - 200) / 600) * 100}%, #1a2a3a ${((ballastWeight - 200) / 600) * 100}%, #1a2a3a 100%)`,
            }}
          />
          <div className="slider-thumb" style={{ left: `${((ballastWeight - 200) / 600) * 100}%` }}>
            <i className="fas fa-anchor"></i>
          </div>
        </div>
        <div className="slider-range">
          <span>200斤<br /><small>轻载</small></span>
          <span>800斤<br /><small>重载</small></span>
        </div>
      </div>
    </div>
  );
};

export default ControlSliders;
