import { useAppStore, PRESET_SCHEMES } from '../store';
import { PlotType, getPlotTypeName } from '../utils/simulation';
import { Save, Trash2, Play, Loader2 } from 'lucide-react';
import { useState } from 'react';

const PLOT_TYPES: { type: PlotType; color: string; label: string }[] = [
  { type: 'tree', color: '#2E7D32', label: '树木' },
  { type: 'grass', color: '#7CB342', label: '草坪' },
  { type: 'water', color: '#29B6F6', label: '水体' },
  { type: 'pavement', color: '#616161', label: '硬地' },
  { type: 'building', color: '#455A64', label: '建筑' },
];

interface SimulationPanelProps {
  onGenerateThumbnail: () => string;
}

export function SimulationPanel({ onGenerateThumbnail }: SimulationPanelProps) {
  const panelWidth = useAppStore((s) => s.blockConfig.width);
  const panelDepth = useAppStore((s) => s.blockConfig.depth);
  const selectedPlotType = useAppStore((s) => s.selectedPlotType);
  const isSimulating = useAppStore((s) => s.isSimulating);
  const simulationResult = useAppStore((s) => s.simulationResult);
  const savedSchemes = useAppStore((s) => s.savedSchemes);
  const activePreset = useAppStore((s) => s.activePreset);
  const showSaveDialog = useAppStore((s) => s.showSaveDialog);
  const hoveredPlot = useAppStore((s) => s.hoveredPlot);
  const plots = useAppStore((s) => s.plots);

  const setBlockSize = useAppStore((s) => s.setBlockSize);
  const setSelectedPlotType = useAppStore((s) => s.setSelectedPlotType);
  const applyPreset = useAppStore((s) => s.applyPreset);
  const runSimulation = useAppStore((s) => s.runSimulation);
  const setShowSaveDialog = useAppStore((s) => s.setShowSaveDialog);
  const saveScheme = useAppStore((s) => s.saveScheme);
  const loadScheme = useAppStore((s) => s.loadScheme);
  const deleteScheme = useAppStore((s) => s.deleteScheme);

  const [saveName, setSaveName] = useState('');

  const handleSave = () => {
    if (!saveName.trim()) return;
    const thumbnail = onGenerateThumbnail();
    saveScheme(saveName.trim(), thumbnail);
    setSaveName('');
  };

  const hoveredPlotType =
    hoveredPlot && plots[hoveredPlot.y]?.[hoveredPlot.x]
      ? plots[hoveredPlot.y][hoveredPlot.x]
      : null;

  const cellAreaSqm =
    (panelWidth / (plots[0]?.length || 1)) *
    (panelDepth / (plots.length || 1));

  const getPlotCostDisplay = (type: PlotType): string => {
    if (type === 'tree') return '500 元/棵';
    const cost = type === 'water' ? 200 : type === 'grass' ? 50 : 0;
    return `${cost} 元/㎡`;
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h2 className="panel-title">街区配置</h2>
      </div>

      <div className="section">
        <h3 className="section-title">街区尺寸</h3>
        <div className="slider-group">
          <div className="slider-item">
            <div className="slider-label">
              <span>宽度</span>
              <span className="slider-value">{panelWidth} m</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={panelWidth}
              onChange={(e) => setBlockSize(Number(e.target.value), panelDepth)}
              className="slider"
            />
          </div>
          <div className="slider-item">
            <div className="slider-label">
              <span>深度</span>
              <span className="slider-value">{panelDepth} m</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={panelDepth}
              onChange={(e) => setBlockSize(panelWidth, Number(e.target.value))}
              className="slider"
            />
          </div>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">地块类型</h3>
        <div className="plot-type-grid">
          {PLOT_TYPES.map(({ type, color, label }) => (
            <button
              key={type}
              className={`plot-type-btn ${selectedPlotType === type ? 'active' : ''}`}
              onClick={() => setSelectedPlotType(type)}
              style={{ '--plot-color': color } as React.CSSProperties}
            >
              <span
                className="plot-type-color"
                style={{ backgroundColor: color }}
              />
              <span className="plot-type-label">{label}</span>
            </button>
          ))}
        </div>
        {hoveredPlotType && (
          <div className="hover-info">
            <span>悬停地块：{getPlotTypeName(hoveredPlotType)}</span>
            <span className="cost-text">
              成本：{getPlotCostDisplay(hoveredPlotType)}
            </span>
            {hoveredPlot && (
              <span className="cell-area">
                单块面积：{cellAreaSqm.toFixed(1)} ㎡
              </span>
            )}
          </div>
        )}
      </div>

      <div className="section">
        <h3 className="section-title">预设方案</h3>
        <div className="preset-list">
          {PRESET_SCHEMES.map((preset) => (
            <button
              key={preset.id}
              className={`preset-card ${activePreset === preset.id ? 'active' : ''}`}
              onClick={() => applyPreset(preset.id)}
            >
              <div className="preset-name">{preset.name}</div>
              <div className="preset-desc">{preset.description}</div>
              <div className="preset-stats">
                <span>树冠覆盖 {preset.canopyCoverage}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <button
          className="simulate-btn"
          onClick={runSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? (
            <>
              <Loader2 className="spin-icon" size={18} />
              模拟中...
            </>
          ) : (
            <>
              <Play size={18} />
              开始模拟
            </>
          )}
        </button>
      </div>

      {simulationResult && (
        <div className="section result-section">
          <h3 className="section-title">模拟结果</h3>
          <div className="result-grid">
            <div className="result-item temp">
              <span className="result-label">平均温度变化</span>
              <span className="result-value">
                {simulationResult.avgTempChange > 0 ? '+' : ''}
                {simulationResult.avgTempChange} ℃
              </span>
            </div>
            <div className="result-item humidity">
              <span className="result-label">平均湿度变化</span>
              <span className="result-value">
                {simulationResult.avgHumidityChange > 0 ? '+' : ''}
                {simulationResult.avgHumidityChange} %
              </span>
            </div>
            <div className="result-item wind">
              <span className="result-label">平均风速变化</span>
              <span className="result-value">
                {simulationResult.avgWindChange > 0 ? '+' : ''}
                {simulationResult.avgWindChange} m/s
              </span>
            </div>
          </div>
          <button
            className="save-btn"
            onClick={() => setShowSaveDialog(true)}
            disabled={savedSchemes.length >= 5}
          >
            <Save size={16} />
            保存方案 ({savedSchemes.length}/5)
          </button>
        </div>
      )}

      <div className="section saved-section">
        <h3 className="section-title">已保存方案</h3>
        {savedSchemes.length === 0 ? (
          <p className="empty-text">暂无保存的方案</p>
        ) : (
          <div className="saved-list">
            {savedSchemes.map((scheme) => (
              <div key={scheme.id} className="saved-item">
                <img
                  src={scheme.thumbnail}
                  alt={scheme.name}
                  className="saved-thumb"
                />
                <div className="saved-info">
                  <span className="saved-name">{scheme.name}</span>
                  <span className="saved-meta">
                    {scheme.blockConfig.width}×{scheme.blockConfig.depth}m
                  </span>
                </div>
                <div className="saved-actions">
                  <button
                    className="action-btn load"
                    onClick={() => loadScheme(scheme.id)}
                    title="加载"
                  >
                    加载
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => deleteScheme(scheme.id)}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSaveDialog && (
        <div className="dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">保存方案</h3>
            <input
              type="text"
              className="dialog-input"
              placeholder="输入方案名称"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            <div className="dialog-actions">
              <button
                className="dialog-btn cancel"
                onClick={() => setShowSaveDialog(false)}
              >
                取消
              </button>
              <button
                className="dialog-btn confirm"
                onClick={handleSave}
                disabled={!saveName.trim()}
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
