import React from 'react';
import { useDNAContext, VisualMode } from '../context/DNAContext';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange }) => {
  return (
    <div className="control-group">
      <div className="control-label">
        <span>{label}</span>
        <span className="control-value">
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit || ''}
        </span>
      </div>
      <div className="slider-wrapper">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};

interface ModeButtonProps {
  mode: VisualMode;
  current: VisualMode;
  label: string;
  icon: string;
  onClick: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({ mode, current, label, icon, onClick }) => {
  const active = mode === current;
  return (
    <button className={`mode-btn ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="mode-btn-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const ControlPanel: React.FC = () => {
  const { params, setParams, visualMode, setVisualMode, highlightedBasePair, clearHighlight } = useDNAContext();

  return (
    <>
      <h2 className="panel-title">参数控制</h2>

      <Slider
        label="螺旋圈数"
        value={params.turns}
        min={5}
        max={15}
        step={1}
        unit=" 圈"
        onChange={(v) => setParams({ turns: v })}
      />

      <Slider
        label="碱基对间距"
        value={params.basePairSpacing}
        min={0.5}
        max={2.0}
        step={0.05}
        unit=""
        onChange={(v) => setParams({ basePairSpacing: v })}
      />

      <Slider
        label="主链宽度"
        value={params.backboneWidth}
        min={0.1}
        max={0.5}
        step={0.01}
        unit=""
        onChange={(v) => setParams({ backboneWidth: v })}
      />

      <div className="control-group">
        <div className="control-label">
          <span>可视化模式</span>
        </div>
        <div className="mode-buttons">
          <ModeButton
            mode="full"
            current={visualMode}
            label="完整模式"
            icon="🧬"
            onClick={() => setVisualMode('full')}
          />
          <ModeButton
            mode="backbone"
            current={visualMode}
            label="仅主链"
            icon="〰️"
            onClick={() => setVisualMode('backbone')}
          />
          <ModeButton
            mode="teaching"
            current={visualMode}
            label="教学标注"
            icon="📚"
            onClick={() => setVisualMode('teaching')}
          />
        </div>
      </div>

      <button className="clear-btn" onClick={clearHighlight} disabled={!highlightedBasePair}>
        ✕ 清除高亮
      </button>

      <div className="legend">
        <div className="legend-title">图例说明</div>
        <div className="legend-item">
          <span className="legend-color blue" />
          <span>主链 A (5'→3')</span>
        </div>
        <div className="legend-item">
          <span className="legend-color red" />
          <span>主链 B (3'→5')</span>
        </div>
        <div className="legend-item">
          <span className="legend-color green" />
          <span>碱基对 A-T</span>
        </div>
        <div className="legend-item">
          <span className="legend-color yellow" />
          <span>碱基对 G-C</span>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
