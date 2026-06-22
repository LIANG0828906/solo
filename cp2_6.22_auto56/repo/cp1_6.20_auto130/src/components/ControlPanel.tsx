import { CityParams, HeightDistributionMode } from '../modules/BuildingGenerator';
import { DisplayMode } from '../App';

interface ControlPanelProps {
  params: CityParams;
  displayMode: DisplayMode;
  sunAngle: number;
  walkSpeed: number;
  onParamsChange: (params: Partial<CityParams>) => void;
  onHeightModeChange: (mode: HeightDistributionMode) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onSunAngleChange: (angle: number) => void;
  onWalkSpeedChange: (speed: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  configs: any[];
  configName: string;
  onConfigNameChange: (name: string) => void;
  onSaveConfig: () => void;
  onLoadConfig: (config: any) => void;
}

const heightModeLabels: Record<HeightDistributionMode, string> = {
  uniform: '均匀分布',
  gradient: '渐高模式',
  centerHigh: '中心高',
  random: '随机模式',
};

const displayModeData: { mode: DisplayMode; label: string; color: string }[] = [
  { mode: 'normal', label: '普通显示', color: '#4a90d9' },
  { mode: 'heightColor', label: '按高度配色', color: 'linear-gradient(90deg, #0066ff, #ff3333)' },
  { mode: 'shadow', label: '阴影模拟', color: '#2a2a3e' },
  { mode: 'heatmap', label: '密度热力图', color: 'linear-gradient(90deg, #0066ff, #ff6666)' },
];

function ControlPanel({
  params,
  displayMode,
  sunAngle,
  walkSpeed,
  onParamsChange,
  onHeightModeChange,
  onDisplayModeChange,
  onSunAngleChange,
  onWalkSpeedChange,
  collapsed,
  onToggleCollapse,
  configs,
  configName,
  onConfigNameChange,
  onSaveConfig,
  onLoadConfig,
}: ControlPanelProps) {
  return (
    <div className={`side-panel left ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <h3>参数控制</h3>
        <button className="toggle-btn" onClick={onToggleCollapse}>
          {collapsed ? (
            <svg viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          )}
        </button>
      </div>
      <div className="panel-content">
        <div className="control-group">
          <h4>城市基本参数</h4>
          
          <div className="control-item">
            <div className="control-label">
              <span>网格大小</span>
              <span className="control-value">{params.gridSize} × {params.gridSize}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={10}
              max={50}
              step={5}
              value={params.gridSize}
              onChange={(e) => onParamsChange({ gridSize: parseInt(e.target.value) })}
            />
          </div>

          <div className="control-item">
            <div className="control-label">
              <span>建筑密度</span>
              <span className="control-value">{params.density}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={10}
              max={90}
              step={5}
              value={params.density}
              onChange={(e) => onParamsChange({ density: parseInt(e.target.value) })}
            />
          </div>

          <div className="control-item">
            <div className="control-label">
              <span>最小高度</span>
              <span className="control-value">{params.minHeight}m</span>
            </div>
            <input
              type="range"
              className="slider"
              min={10}
              max={100}
              step={5}
              value={params.minHeight}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val < params.maxHeight) {
                  onParamsChange({ minHeight: val });
                }
              }}
            />
          </div>

          <div className="control-item">
            <div className="control-label">
              <span>最大高度</span>
              <span className="control-value">{params.maxHeight}m</span>
            </div>
            <input
              type="range"
              className="slider"
              min={10}
              max={100}
              step={5}
              value={params.maxHeight}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > params.minHeight) {
                  onParamsChange({ maxHeight: val });
                }
              }}
            />
          </div>
        </div>

        <div className="control-group">
          <h4>高度分布模式</h4>
          <div className="mode-buttons">
            {(['uniform', 'gradient', 'centerHigh', 'random'] as HeightDistributionMode[]).map((mode) => (
              <button
                key={mode}
                className={`mode-btn ${params.heightMode === mode ? 'active' : ''}`}
                onClick={() => onHeightModeChange(mode)}
              >
                {heightModeLabels[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <h4>显示模式</h4>
          <div className="display-modes">
            {displayModeData.map(({ mode, label, color }) => (
              <button
                key={mode}
                className={`display-btn ${displayMode === mode ? 'active' : ''}`}
                onClick={() => onDisplayModeChange(mode)}
              >
                <span
                  className="color-preview"
                  style={{
                    background: color,
                    borderRadius: '3px',
                  }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>

        {displayMode === 'shadow' && (
          <div className="control-group">
            <h4>太阳方位角</h4>
            <div className="control-item">
              <div className="control-label">
                <span>角度</span>
                <span className="control-value">{sunAngle}°</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={360}
                step={5}
                value={sunAngle}
                onChange={(e) => onSunAngleChange(parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

        <div className="control-group">
          <h4>漫游设置</h4>
          <div className="control-item">
            <div className="control-label">
              <span>漫游速度</span>
              <span className="control-value">{walkSpeed}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={5}
              max={50}
              step={1}
              value={walkSpeed}
              onChange={(e) => onWalkSpeedChange(parseInt(e.target.value))}
            />
          </div>
        </div>

        <button
          className="regen-btn"
          onClick={() => onParamsChange({ ...params })}
        >
          🔄 重新生成
        </button>

        <div className="config-section">
          <h4>配置模板</h4>
          <div className="save-input-row">
            <input
              type="text"
              className="save-input"
              placeholder="配置名称"
              value={configName}
              onChange={(e) => onConfigNameChange(e.target.value)}
            />
            <button className="save-btn" onClick={onSaveConfig}>
              保存
            </button>
          </div>
          <div className="config-list">
            {configs.map((config) => (
              <div key={config.id} className="config-item" onClick={() => onLoadConfig(config)}>
                <span className="config-item-name">{config.name}</span>
                <div className="config-item-btns">
                  <button
                    className="config-item-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadConfig(config);
                    }}
                    title="加载"
                  >
                    📂
                  </button>
                </div>
              </div>
            ))}
            {configs.length === 0 && (
              <div style={{ fontSize: '11px', color: '#808090', textAlign: 'center', padding: '12px' }}>
                暂无保存的配置
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
