import React, { useState } from 'react';
import {
  ParticleParams,
  ForceFieldParams,
  RenderParams,
  Vec3,
} from '../types';

interface ControlPanelProps {
  particleParams: ParticleParams;
  forceFieldParams: ForceFieldParams;
  renderParams: RenderParams;
  onParticleChange: (params: ParticleParams) => void;
  onForceFieldChange: (params: ForceFieldParams) => void;
  onRenderChange: (params: RenderParams) => void;
}

interface CollapseSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapseSection: React.FC<CollapseSectionProps> = ({
  title,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapse-group">
      <div className="collapse-header" onClick={() => setOpen(!open)}>
        <span className="collapse-title">{title}</span>
        <span className={`collapse-icon ${open ? 'open' : ''}`}>▼</span>
      </div>
      <div className={`collapse-body ${open ? 'open' : ''}`}>
        <div className="collapse-content">{children}</div>
      </div>
    </div>
  );
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}) => {
  return (
    <div className="field">
      <div className="field-row">
        <span className="field-label">{label}</span>
        <span className="field-value">
          {typeof value === 'number' && !Number.isInteger(step)
            ? value.toFixed(1)
            : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
};

interface VectorSliderProps {
  label: string;
  value: Vec3;
  min: number;
  max: number;
  step?: number;
  onChange: (value: Vec3) => void;
}

const VectorSlider: React.FC<VectorSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}) => {
  return (
    <div className="field">
      <div className="field-row">
        <span className="field-label">{label}</span>
      </div>
      <div className="vector-group">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="vector-item">
            <span className={`vector-axis ${axis}`}>{axis.toUpperCase()}</span>
            <input
              type="range"
              className="slider"
              min={min}
              max={max}
              step={step}
              value={value[axis]}
              onChange={(e) =>
                onChange({ ...value, [axis]: Number(e.target.value) })
              }
            />
            <span className="field-value" style={{ minWidth: 32, fontSize: 11 }}>
              {value[axis].toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  particleParams,
  forceFieldParams,
  renderParams,
  onParticleChange,
  onForceFieldChange,
  onRenderChange,
}) => {
  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...renderParams.colors];
    newColors[index] = newColor;
    onRenderChange({ ...renderParams, colors: newColors });
  };

  const handleAddColor = () => {
    if (renderParams.colors.length >= 4) return;
    const newColors = [...renderParams.colors, '#FFFFFF'];
    onRenderChange({ ...renderParams, colors: newColors });
  };

  const handleRemoveColor = (index: number) => {
    if (renderParams.colors.length <= 2) return;
    const newColors = renderParams.colors.filter((_, i) => i !== index);
    onRenderChange({ ...renderParams, colors: newColors });
  };

  return (
    <aside className="control-panel">
      <CollapseSection title="粒子参数" defaultOpen>
        <Slider
          label="粒子数量"
          value={particleParams.count}
          min={50}
          max={500}
          step={10}
          onChange={(v) => onParticleChange({ ...particleParams, count: v })}
        />
        <VectorSlider
          label="初始速度矢量"
          value={particleParams.velocity}
          min={-5}
          max={5}
          step={0.1}
          onChange={(v) => onParticleChange({ ...particleParams, velocity: v })}
        />
        <Slider
          label="发射角度"
          value={particleParams.emissionAngle}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(v) =>
            onParticleChange({ ...particleParams, emissionAngle: v })
          }
        />
        <Slider
          label="生命周期"
          value={particleParams.lifetime}
          min={1}
          max={10}
          step={0.5}
          unit="s"
          onChange={(v) => onParticleChange({ ...particleParams, lifetime: v })}
        />
        <Slider
          label="粒子大小"
          value={particleParams.size}
          min={1}
          max={8}
          step={0.5}
          unit="px"
          onChange={(v) => onParticleChange({ ...particleParams, size: v })}
        />
      </CollapseSection>

      <CollapseSection title="场力参数" defaultOpen>
        <div className="field">
          <div className="field-row">
            <span className="field-label">重力场方向轴</span>
          </div>
          <div className="select-field">
            <select
              className="select-input"
              value={forceFieldParams.gravity.axis}
              onChange={(e) =>
                onForceFieldChange({
                  ...forceFieldParams,
                  gravity: {
                    ...forceFieldParams.gravity,
                    axis: e.target.value as 'x' | 'y' | 'z',
                  },
                })
              }
            >
              <option value="x">X 轴</option>
              <option value="y">Y 轴（默认向下）</option>
              <option value="z">Z 轴</option>
            </select>
          </div>
        </div>
        <Slider
          label="重力强度"
          value={forceFieldParams.gravity.strength}
          min={-10}
          max={10}
          step={0.5}
          onChange={(v) =>
            onForceFieldChange({
              ...forceFieldParams,
              gravity: { ...forceFieldParams.gravity, strength: v },
            })
          }
        />

        <Slider
          label="涡旋场强度"
          value={forceFieldParams.vortex.strength}
          min={0}
          max={50}
          step={1}
          onChange={(v) =>
            onForceFieldChange({
              ...forceFieldParams,
              vortex: { ...forceFieldParams.vortex, strength: v },
            })
          }
        />
        <Slider
          label="涡旋场影响半径"
          value={forceFieldParams.vortex.radius}
          min={50}
          max={200}
          step={5}
          unit="u"
          onChange={(v) =>
            onForceFieldChange({
              ...forceFieldParams,
              vortex: { ...forceFieldParams.vortex, radius: v },
            })
          }
        />
        <VectorSlider
          label="涡旋场中心位置"
          value={forceFieldParams.vortex.position}
          min={-10}
          max={10}
          step={0.5}
          onChange={(v) =>
            onForceFieldChange({
              ...forceFieldParams,
              vortex: { ...forceFieldParams.vortex, position: v },
            })
          }
        />

        <Slider
          label="风场方向"
          value={forceFieldParams.wind.angle}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(v) =>
            onForceFieldChange({
              ...forceFieldParams,
              wind: { ...forceFieldParams.wind, angle: v },
            })
          }
        />
        <Slider
          label="风场强度"
          value={forceFieldParams.wind.strength}
          min={0}
          max={20}
          step={0.5}
          onChange={(v) =>
            onForceFieldChange({
              ...forceFieldParams,
              wind: { ...forceFieldParams.wind, strength: v },
            })
          }
        />
      </CollapseSection>

      <CollapseSection title="渲染参数" defaultOpen>
        <div className="field">
          <div className="field-row">
            <span className="field-label">渐变颜色（{renderParams.colors.length}/4）</span>
          </div>
          <div className="colors-picker">
            {renderParams.colors.map((color, i) => (
              <div
                key={i}
                className="color-item"
                onDoubleClick={() => handleRemoveColor(i)}
                title={color + (renderParams.colors.length > 2 ? '（双击移除）' : '')}
                style={{ background: color }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(i, e.target.value)}
                />
              </div>
            ))}
            <button
              className="color-add-btn"
              onClick={handleAddColor}
              disabled={renderParams.colors.length >= 4}
              title="添加颜色"
            >
              +
            </button>
          </div>
        </div>
        <Slider
          label="拖尾长度"
          value={renderParams.trailLength}
          min={5}
          max={20}
          step={1}
          unit="帧"
          onChange={(v) => onRenderChange({ ...renderParams, trailLength: v })}
        />
      </CollapseSection>
    </aside>
  );
};

export default ControlPanel;
