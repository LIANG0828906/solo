import { useTerrainStore } from '../store';
import type { BrushType, BrushShape } from '../types';

const brushTypes: { type: BrushType; label: string; icon: string }[] = [
  { type: 'raise', label: '隆起', icon: '▲' },
  { type: 'lower', label: '凹陷', icon: '▼' },
  { type: 'smooth', label: '平滑', icon: '〜' },
];

const brushShapes: { shape: BrushShape; label: string; icon: string }[] = [
  { shape: 'circle', label: '圆形', icon: '●' },
  { shape: 'square', label: '矩形', icon: '■' },
];

export default function TerrainBrush() {
  const { brush, setBrushType, setBrushShape, setBrushStrength } = useTerrainStore();

  return (
    <div className="brush-panel">
      <h3 className="brush-title">地形笔刷</h3>

      <div className="brush-section">
        <div className="section-label">笔刷模式</div>
        <div className="brush-btn-group">
          {brushTypes.map((b) => (
            <button
              key={b.type}
              className={`brush-btn ${brush.type === b.type ? 'active' : ''}`}
              onClick={() => setBrushType(b.type)}
            >
              <span className="brush-icon">{b.icon}</span>
              <span className="brush-label">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="brush-section">
        <div className="section-label">笔刷形状</div>
        <div className="brush-btn-group small">
          {brushShapes.map((s) => (
            <button
              key={s.shape}
              className={`shape-btn ${brush.shape === s.shape ? 'active' : ''}`}
              onClick={() => setBrushShape(s.shape)}
            >
              <span className="shape-icon">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="brush-section">
        <div className="section-label">
          压力强度 <span className="value">{brush.strength}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={brush.strength}
          onChange={(e) => setBrushStrength(Number(e.target.value))}
          className="strength-slider"
        />
        <div className="slider-labels">
          <span>弱</span>
          <span>强</span>
        </div>
      </div>
    </div>
  );
}
