import { useState } from 'react';
import {
  useGradientStore,
  type GradientType,
  type Preset,
} from './GradientStore';
import { generateCSS } from './GradientCanvas';

const typeLabels: Record<GradientType, string> = {
  linear: '线性',
  radial: '径向',
  conic: '圆锥',
};

export function ControlPanel() {
  const type = useGradientStore((state) => state.type);
  const angle = useGradientStore((state) => state.angle);
  const centerX = useGradientStore((state) => state.centerX);
  const centerY = useGradientStore((state) => state.centerY);
  const colorStops = useGradientStore((state) => state.colorStops);
  const presets = useGradientStore((state) => state.presets);
  const setType = useGradientStore((state) => state.setType);
  const setAngle = useGradientStore((state) => state.setAngle);
  const setCenter = useGradientStore((state) => state.setCenter);
  const addColorStop = useGradientStore((state) => state.addColorStop);
  const removeColorStop = useGradientStore((state) => state.removeColorStop);
  const updateColorStopColor = useGradientStore(
    (state) => state.updateColorStopColor
  );
  const updateColorStopPosition = useGradientStore(
    (state) => state.updateColorStopPosition
  );
  const applyPreset = useGradientStore((state) => state.applyPreset);

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const handleAddStop = () => {
    addColorStop(50);
  };

  const handlePresetClick = (presetId: string) => {
    applyPreset(presetId);
  };

  const getPresetGradient = (preset: Preset): string => {
    return generateCSS(
      preset.type,
      preset.angle,
      preset.centerX,
      preset.centerY,
      preset.colorStops.map((s) => ({ ...s, id: '' }))
    );
  };

  const showCenterControls = type === 'radial' || type === 'conic';

  return (
    <aside className="control-panel">
      <div className="app-title">
        <div className="app-title-icon" />
        CSS 渐变调试器
      </div>

      <div className="control-section">
        <div className="control-section-title">渐变类型</div>
        <div className="type-selector">
          {(Object.keys(typeLabels) as GradientType[]).map((t) => (
            <button
              key={t}
              className={`type-btn ${type === t ? 'active' : ''}`}
              onClick={() => setType(t)}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <div className="control-section-title">
          {type === 'linear' ? '角度' : '起始角度'}
        </div>
        <div className="slider-row">
          <span className="slider-label">角度</span>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="slider-input"
          />
          <span className="slider-value">{angle}°</span>
        </div>
      </div>

      {showCenterControls && (
        <div className="control-section">
          <div className="control-section-title">渐变中心</div>
          <div className="center-inputs">
            <div className="center-input">
              <label>X (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={centerX}
                onChange={(e) =>
                  setCenter(Number(e.target.value) || 0, centerY)
                }
              />
            </div>
            <div className="center-input">
              <label>Y (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={centerY}
                onChange={(e) =>
                  setCenter(centerX, Number(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </div>
      )}

      <div className="control-section">
        <div className="control-section-title">色标</div>
        <div className="color-stops-list">
          {colorStops.map((stop) => (
            <div
              key={stop.id}
              className={`color-stop-item ${
                selectedStopId === stop.id ? 'selected' : ''
              }`}
              onClick={() => setSelectedStopId(stop.id)}
            >
              <div
                className="color-picker-wrapper"
                style={{ background: stop.color }}
              >
                <input
                  type="color"
                  value={stop.color.startsWith('#') ? stop.color : '#000000'}
                  onChange={(e) =>
                    updateColorStopColor(stop.id, e.target.value)
                  }
                  className="color-picker-input"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={stop.position}
                onChange={(e) =>
                  updateColorStopPosition(
                    stop.id,
                    Number(e.target.value) || 0
                  )
                }
                className="color-stop-position"
                onClick={(e) => e.stopPropagation()}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                %
              </span>
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeColorStop(stop.id);
                }}
                disabled={colorStops.length <= 2}
                title="删除色标"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className="add-stop-btn" onClick={handleAddStop}>
          + 添加色标
        </button>
      </div>

      <div className="control-section">
        <div className="control-section-title">预设库</div>
        <div className="presets-grid">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="preset-card"
              style={{ background: getPresetGradient(preset) }}
              onClick={() => handlePresetClick(preset.id)}
              title={preset.name}
            >
              <div className="preset-name">{preset.name}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
