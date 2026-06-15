import { StarData, SpectralType, SPECTRAL_TYPES, SPECTRAL_COLORS } from '../stars/types';
import SpectrumChart from './SpectrumChart';

interface ControlPanelProps {
  selectedStar: StarData | null;
  brightness: number;
  activeFilters: SpectralType[];
  onBrightnessChange: (value: number) => void;
  onFilterChange: (filters: SpectralType[]) => void;
}

export default function ControlPanel({
  selectedStar,
  brightness,
  activeFilters,
  onBrightnessChange,
  onFilterChange,
}: ControlPanelProps) {
  const handleFilterToggle = (type: SpectralType) => {
    if (activeFilters.includes(type)) {
      if (activeFilters.length > 1) {
        onFilterChange(activeFilters.filter((t) => t !== type));
      }
    } else {
      onFilterChange([...activeFilters, type]);
    }
  };

  const handleSelectAll = () => {
    onFilterChange([...SPECTRAL_TYPES]);
  };

  const handleClearAll = () => {
    onFilterChange([SPECTRAL_TYPES[SPECTRAL_TYPES.length - 1]]);
  };

  return (
    <div className="control-panel">
      <div className="panel-title">StellarSpectra</div>
      <div className="panel-subtitle">恒星光谱可视化</div>

      <div className="panel-section">
        <div className="section-title">光谱类型筛选</div>
        <div className="filter-buttons">
          {SPECTRAL_TYPES.map((type) => (
            <button
              key={type}
              className={`filter-btn ${activeFilters.includes(type) ? 'active' : ''}`}
              style={{
                backgroundColor: activeFilters.includes(type) ? SPECTRAL_COLORS[type] : 'transparent',
                borderColor: activeFilters.includes(type) ? SPECTRAL_COLORS[type] : 'rgba(255,255,255,0.2)',
                color: activeFilters.includes(type) ? '#0a0a2e' : '#e0e0e0',
              }}
              onClick={() => handleFilterToggle(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="filter-actions">
          <button className="text-btn" onClick={handleSelectAll}>全选</button>
          <span className="divider">|</span>
          <button className="text-btn" onClick={handleClearAll}>清空</button>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-title">
          亮度调节
          <span className="brightness-value">{brightness.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={brightness}
          onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
          className="brightness-slider"
        />
        <div className="slider-labels">
          <span>0.5x</span>
          <span>2.0x</span>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-title">恒星信息</div>
        {selectedStar ? (
          <div className="star-info">
            <div className="info-row">
              <span className="info-label">名称</span>
              <span className="info-value">{selectedStar.name}</span>
            </div>
            <div className="info-divider" />
            <div className="info-row">
              <span className="info-label">光谱类型</span>
              <span
                className="info-value spectral-badge"
                style={{
                  backgroundColor: SPECTRAL_COLORS[selectedStar.spectralType],
                  color: '#0a0a2e',
                }}
              >
                {selectedStar.spectralType}型
              </span>
            </div>
            <div className="info-divider" />
            <div className="info-row">
              <span className="info-label">温度</span>
              <span className="info-value">{selectedStar.temperature.toLocaleString()}K</span>
            </div>
            <div className="info-divider" />
            <div className="info-row">
              <span className="info-label">绝对星等</span>
              <span className="info-value">{selectedStar.absoluteMagnitude.toFixed(1)}</span>
            </div>

            <SpectrumChart
              temperature={selectedStar.temperature}
              starColor={selectedStar.color}
            />
          </div>
        ) : (
          <div className="no-selection">
            <p>点击场景中的恒星</p>
            <p className="hint">查看详细信息与光谱曲线</p>
          </div>
        )}
      </div>
    </div>
  );
}
