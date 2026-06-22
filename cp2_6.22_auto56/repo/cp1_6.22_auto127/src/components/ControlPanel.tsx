interface ControlPanelProps {
  year: number;
  minYear: number;
  maxYear: number;
  minDensity: number;
  maxDensity: number;
  onYearChange: (year: number) => void;
  onViewChange: (view: string) => void;
}

function ControlPanel({
  year,
  minYear,
  maxYear,
  minDensity,
  maxDensity,
  onYearChange,
  onViewChange
}: ControlPanelProps) {

  const midDensity = Math.round((minDensity + maxDensity) / 2);

  const handleViewClick = (view: string) => {
    onViewChange(view);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onYearChange(parseInt(e.target.value));
  };

  const yearProgress = (year - minYear) / (maxYear - minYear);

  return (
    <div className="panel control-panel">
      <div className="panel-title">控制面板</div>
      
      <div className="year-display">{year}年</div>
      
      <div className="slider-container">
        <div className="slider-label">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={year}
          step={1}
          onChange={handleSliderChange}
          className="slider"
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <div className="section-label">预设视角</div>
        <div className="view-buttons">
          <button className="view-btn" onClick={() => handleViewClick('overhead')}>
            俯瞰
          </button>
          <button className="view-btn" onClick={() => handleViewClick('southeast')}>
            东南45°
          </button>
          <button className="view-btn" onClick={() => handleViewClick('front')}>
            正面
          </button>
        </div>
      </div>
      
      <div>
        <div className="section-label">色标图例</div>
        <div className="legend-container">
          <div className="legend-wrapper">
            <div className="legend-bar">
              <div
                className="legend-indicator"
                style={{ top: `${(1 - yearProgress) * 100}%` }}
              />
            </div>
          </div>
          <div className="legend-labels">
            <div>{Math.round(maxDensity)} 人/km²</div>
            <div>{midDensity} 人/km²</div>
            <div>{Math.round(minDensity)} 人/km²</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
