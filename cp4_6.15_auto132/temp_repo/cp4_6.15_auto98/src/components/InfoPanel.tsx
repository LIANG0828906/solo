import { useAppStore } from '../utils/store';
import './InfoPanel.css';

export default function InfoPanel() {
  const { selectedPoint, setSelectedPoint, intensityScale } = useAppStore();

  if (!selectedPoint) return null;

  const formatLat = (lat: number): string => {
    const direction = lat >= 0 ? 'N' : 'S';
    return `${Math.abs(lat).toFixed(2)}° ${direction}`;
  };

  const formatLon = (lon: number): string => {
    const direction = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lon).toFixed(2)}° ${direction}`;
  };

  return (
    <div className="info-panel">
      <button
        className="info-close"
        onClick={() => setSelectedPoint(null)}
        aria-label="关闭"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <h3 className="info-title">磁场数据</h3>

      <div className="info-section">
        <h4 className="info-label">地理位置</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="item-label">纬度</span>
            <span className="item-value">{formatLat(selectedPoint.lat)}</span>
          </div>
          <div className="info-item">
            <span className="item-label">经度</span>
            <span className="item-value">{formatLon(selectedPoint.lon)}</span>
          </div>
        </div>
      </div>

      <div className="info-divider" />

      <div className="info-section">
        <h4 className="info-label">磁场强度</h4>
        <div className="intensity-display">
          <span className="intensity-value">
            {(selectedPoint.intensity / 1000).toFixed(2)}
          </span>
          <span className="intensity-unit">μT</span>
        </div>
        <div className="intensity-bar">
          <div
            className="intensity-fill"
            style={{
              width: `${Math.min((selectedPoint.intensity / 80000) * 100, 100)}%`,
            }}
          />
        </div>
        <div className="intensity-labels">
          <span>弱</span>
          <span>强</span>
        </div>
      </div>

      <div className="info-divider" />

      <div className="info-section">
        <h4 className="info-label">磁倾角</h4>
        <div className="inclination-display">
          <svg className="inclination-icon" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(100,150,255,0.3)" strokeWidth="2" />
            <line
              x1="30"
              y1="30"
              x2={30 + 25 * Math.cos((selectedPoint.inclination * Math.PI) / 180 - Math.PI / 2)}
              y2={30 + 25 * Math.sin((selectedPoint.inclination * Math.PI) / 180 - Math.PI / 2)}
              stroke="#66aaff"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="30" cy="30" r="4" fill="#66aaff" />
          </svg>
          <span className="inclination-value">
            {selectedPoint.inclination.toFixed(1)}°
          </span>
        </div>
      </div>

      <div className="info-hint">
        缩放因子: {intensityScale.toFixed(2)}x
      </div>
    </div>
  );
}
