import './ControlPanel.css';
import type { ProductSettings, CompareMode, CategoryTab } from '../types';

interface ControlPanelProps {
  settings: ProductSettings;
  compareMode: CompareMode;
  showKeypoints: boolean;
  activeCategory: CategoryTab;
  onSettingsChange: (settings: Partial<ProductSettings>) => void;
  onCompareModeChange: (mode: CompareMode) => void;
  onShowKeypointsChange: (show: boolean) => void;
  onSaveScreenshot: () => void;
  isCollapsed?: boolean;
}

export function ControlPanel({
  settings,
  compareMode,
  showKeypoints,
  activeCategory,
  onSettingsChange,
  onCompareModeChange,
  onShowKeypointsChange,
  onSaveScreenshot,
  isCollapsed = false,
}: ControlPanelProps) {
  if (isCollapsed) {
    return null;
  }

  return (
    <div className="control-panel">
      <h3 className="panel-title">调整控制</h3>

      <div className="control-section">
        <label className="control-label">
          {activeCategory === 'lipstick' && '口红透明度'}
          {activeCategory === 'eyeshadow' && '珠光强度'}
          {activeCategory === 'blush' && '范围大小'}
        </label>
        <div className="slider-container">
          <input
            type="range"
            min={activeCategory === 'lipstick' ? 30 : activeCategory === 'blush' ? 50 : 0}
            max={activeCategory === 'blush' ? 150 : 100}
            value={
              activeCategory === 'lipstick'
                ? settings.lipstickOpacity * 100
                : activeCategory === 'eyeshadow'
                ? settings.eyeshadowShimmer * 100
                : settings.blushSize
            }
            onChange={(e) => {
              const value = Number(e.target.value);
              if (activeCategory === 'lipstick') {
                onSettingsChange({ lipstickOpacity: value / 100 });
              } else if (activeCategory === 'eyeshadow') {
                onSettingsChange({ eyeshadowShimmer: value / 100 });
              } else {
                onSettingsChange({ blushSize: value });
              }
            }}
            className="slider"
          />
          <span className="slider-value">
            {Math.round(
              activeCategory === 'lipstick'
                ? settings.lipstickOpacity * 100
                : activeCategory === 'eyeshadow'
                ? settings.eyeshadowShimmer * 100
                : settings.blushSize,
            )}
            %
          </span>
        </div>
      </div>

      <div className="control-section">
        <label className="control-label">对比模式</label>
        <div className="compare-buttons">
          <button
            className={`compare-btn ${compareMode === 'none' ? 'active' : ''}`}
            onClick={() => onCompareModeChange('none')}
          >
            关闭
          </button>
          <button
            className={`compare-btn ${compareMode === 'split' ? 'active' : ''}`}
            onClick={() => onCompareModeChange('split')}
          >
            分割
          </button>
          <button
            className={`compare-btn ${compareMode === 'sidebyside' ? 'active' : ''}`}
            onClick={() => onCompareModeChange('sidebyside')}
          >
            并排
          </button>
        </div>
      </div>

      <div className="control-section">
        <div className="toggle-row">
          <span className="toggle-label">显示关键点</span>
          <label className="ios-switch">
            <input
              type="checkbox"
              checked={showKeypoints}
              onChange={(e) => onShowKeypointsChange(e.target.checked)}
            />
            <span className="slider-toggle" />
          </label>
        </div>
      </div>

      <button className="save-btn" onClick={onSaveScreenshot}>
        保存截图
      </button>
    </div>
  );
}
