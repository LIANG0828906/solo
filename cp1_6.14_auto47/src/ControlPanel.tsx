import { useState, useEffect, useMemo } from 'react';
import { BuildingShape, ClimateMode, Building, ClimateParams, PresetData } from './types';

interface ControlPanelProps {
  selectedShape: BuildingShape;
  onShapeChange: (shape: BuildingShape) => void;
  selectedHeight: number;
  onHeightChange: (height: number) => void;
  selectedWidth: number;
  onWidthChange: (width: number) => void;
  climateMode: ClimateMode;
  onClimateChange: (mode: ClimateMode) => void;
  buildings: Building[];
  presets: PresetData[];
  onLoadPreset: (preset: PresetData) => void;
  onExportScreenshot: () => void;
  onClearAll: () => void;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}

function calculateSmoothnessScore(buildings: Building[]): number {
  if (buildings.length < 2) return 0;

  const heights = buildings.map(b => b.height + b.position[1]);
  const mean = heights.reduce((a, b) => a + b, 0) / heights.length;
  const variance = heights.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / heights.length;
  const stdDev = Math.sqrt(variance);

  const maxExpectedStdDev = 30;
  const normalizedScore = Math.min((stdDev / maxExpectedStdDev) * 100, 100);

  return Math.round(normalizedScore);
}

function getScoreDescription(score: number): string {
  if (score < 20) return '非常平滑，天际线均匀柔和';
  if (score < 40) return '较为平滑，高低变化适中';
  if (score < 60) return '中等参差，有明显起伏';
  if (score < 80) return '较为参差，天际线动感强烈';
  return '非常参差，轮廓线变化剧烈';
}

export default function ControlPanel({
  selectedShape,
  onShapeChange,
  selectedHeight,
  onHeightChange,
  selectedWidth,
  onWidthChange,
  climateMode,
  onClimateChange,
  buildings,
  presets,
  onLoadPreset,
  onExportScreenshot,
  onClearAll,
  isPanelOpen,
  onTogglePanel,
}: ControlPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState('');
  const [climateParams, setClimateParams] = useState<ClimateParams[]>([]);

  const smoothnessScore = useMemo(() => calculateSmoothnessScore(buildings), [buildings]);

  useEffect(() => {
    const loadClimates = async () => {
      try {
        const response = await fetch('/api/climates');
        const data = await response.json();
        if (data.success) {
          setClimateParams(data.data);
        }
      } catch (error) {
        console.error('Failed to load climates:', error);
        setClimateParams([
          { name: '晴天', mode: 'sunny', ambientIntensity: 0.3, directionalIntensity: 1.2, lightColor: '#ffffff', ambientColor: '#87ceeb', sunPosition: [30, 50, 20], shadowBlur: 1 },
          { name: '阴天', mode: 'cloudy', ambientIntensity: 0.6, directionalIntensity: 0.5, lightColor: '#c0c0c0', ambientColor: '#708090', sunPosition: [10, 30, 10], shadowBlur: 4 },
          { name: '黄昏', mode: 'dusk', ambientIntensity: 0.4, directionalIntensity: 0.8, lightColor: '#ff8c42', ambientColor: '#4a3728', sunPosition: [50, 15, 0], shadowBlur: 2 },
        ]);
      }
    };
    loadClimates();
  }, []);

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onLoadPreset(preset);
    }
  };

  const shapes: { value: BuildingShape; label: string; icon: string }[] = [
    { value: 'box', label: '长方体', icon: '▢' },
    { value: 'cylinder', label: '圆柱体', icon: '○' },
    { value: 'pyramid', label: '金字塔', icon: '△' },
  ];

  return (
    <>
      <button className="panel-toggle" onClick={onTogglePanel}>
        {isPanelOpen ? '收起控制面板' : '展开控制面板'}
      </button>

      <div className={`control-panel ${isPanelOpen ? 'open' : ''}`} onContextMenu={(e) => e.preventDefault()}>
        <div className="panel-section">
          <h3 className="panel-title">楼宇形状</h3>
          <div className="shape-buttons">
            {shapes.map(shape => (
              <button
                key={shape.value}
                className={`shape-btn ${selectedShape === shape.value ? 'active' : ''}`}
                onClick={() => onShapeChange(shape.value)}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{shape.icon}</div>
                {shape.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h3 className="panel-title">楼宇尺寸</h3>
          <div className="slider-group">
            <div className="slider-label">
              <span>高度</span>
              <span className="slider-value">{selectedHeight.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="0.5"
              value={selectedHeight}
              onChange={(e) => onHeightChange(parseFloat(e.target.value))}
            />
          </div>
          <div className="slider-group">
            <div className="slider-label">
              <span>宽度</span>
              <span className="slider-value">{selectedWidth.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={selectedWidth}
              onChange={(e) => onWidthChange(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="panel-section">
          <h3 className="panel-title">气候模式</h3>
          <select
            value={climateMode}
            onChange={(e) => onClimateChange(e.target.value as ClimateMode)}
          >
            {climateParams.map(c => (
              <option key={c.mode} value={c.mode}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="panel-section">
          <h3 className="panel-title">天际线分析</h3>
          <div className="score-display">
            <div className="score-value">{smoothnessScore}</div>
            <div className="score-label">平滑度评分</div>
            <div className="score-desc">{getScoreDescription(smoothnessScore)}</div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#7a8a9a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>楼宇数量</span>
              <span style={{ color: '#8ab4ff', fontWeight: 600 }}>{buildings.length}/30</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>最高建筑</span>
              <span style={{ color: '#8ab4ff', fontWeight: 600 }}>
                {buildings.length > 0 ? Math.max(...buildings.map(b => b.height + b.position[1])).toFixed(1) : '0'}m
              </span>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <h3 className="panel-title">预设场景</h3>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            <option value="">选择预设城市...</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>
        </div>

        <div className="panel-section">
          <h3 className="panel-title">操作</h3>
          <button className="action-btn" onClick={onExportScreenshot}>
            📷 导出截图
          </button>
          <button className="action-btn secondary" onClick={onClearAll}>
            🗑️ 清空所有
          </button>
        </div>

        <div className="panel-section">
          <h3 className="panel-title">使用说明</h3>
          <div className="info-text">
            <strong>左键点击地面</strong>：添加楼宇<br />
            <strong>左键点击楼顶</strong>：叠加楼宇<br />
            <strong>左键拖拽楼宇</strong>：移动位置<br />
            <strong>右键点击楼宇</strong>：删除楼宇<br />
            <strong>鼠标滚轮</strong>：缩放视图<br />
            <strong>鼠标右键拖拽</strong>：旋转视角
          </div>
        </div>
      </div>
    </>
  );
}
