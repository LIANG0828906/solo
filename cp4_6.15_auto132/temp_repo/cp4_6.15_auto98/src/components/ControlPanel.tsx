import { useAppStore } from '../utils/store';
import './ControlPanel.css';

export default function ControlPanel() {
  const {
    intensityScale,
    showHeatmap,
    showArrowGrid,
    showFieldLines,
    panelCollapsed,
    reversalActive,
    setIntensityScale,
    setShowHeatmap,
    setShowArrowGrid,
    setShowFieldLines,
    setReversalActive,
    togglePanel,
  } = useAppStore();

  if (panelCollapsed) {
    return (
      <button className="panel-toggle collapsed" onClick={togglePanel}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    );
  }

  return (
    <div className="control-panel">
      <button className="panel-toggle expand" onClick={togglePanel}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className="panel-content">
        <h2 className="panel-title">磁场控制</h2>

        <div className="control-section">
          <label className="control-label">
            <span>强度缩放</span>
            <span className="control-value">{intensityScale.toFixed(2)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.01"
            value={intensityScale}
            onChange={(e) => setIntensityScale(parseFloat(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>0.5x</span>
            <span>2.0x</span>
          </div>
        </div>

        <div className="control-section">
          <div className="toggle-row">
            <span className="toggle-label">显示磁场线</span>
            <button
              className={`toggle-switch ${showFieldLines ? 'active' : ''}`}
              onClick={() => setShowFieldLines(!showFieldLines)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        <div className="control-section">
          <div className="toggle-row">
            <span className="toggle-label">显示热力图</span>
            <button
              className={`toggle-switch ${showHeatmap ? 'active' : ''}`}
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        <div className="control-section">
          <div className="toggle-row">
            <span className="toggle-label">显示箭矢网格</span>
            <button
              className={`toggle-switch ${showArrowGrid ? 'active' : ''}`}
              onClick={() => setShowArrowGrid(!showArrowGrid)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        <div className="divider" />

        <div className="control-section">
          <div className="toggle-row">
            <span className="toggle-label warning">磁场反转模拟</span>
            <button
              className={`toggle-switch danger ${reversalActive ? 'active' : ''}`}
              onClick={() => setReversalActive(!reversalActive)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
          <p className="toggle-hint">
            模拟地磁场极性反转事件
          </p>
        </div>

        <div className="legend-section">
          <h3 className="legend-title">磁场强度图例</h3>
          <div className="legend-gradient" />
          <div className="legend-labels">
            <span>弱</span>
            <span>强</span>
          </div>
        </div>
      </div>
    </div>
  );
}
