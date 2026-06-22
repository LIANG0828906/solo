import React from 'react';
import type { LayoutParams, Alignment } from '../types';

interface ControlPanelProps {
  params: LayoutParams;
  onParamsChange: (params: LayoutParams) => void;
  compareMode: boolean;
  onToggleCompare: () => void;
  onExport: () => void;
  mobileOpen: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamsChange,
  compareMode,
  onToggleCompare,
  onExport,
  mobileOpen,
}) => {
  const update = (partial: Partial<LayoutParams>) => {
    onParamsChange({ ...params, ...partial });
  };

  return (
    <div className={`control-panel${mobileOpen ? ' open' : ''}`}>
      <h2>排版参数</h2>

      <div className="param-group">
        <label>字体大小: {params.fontSize}px</label>
        <div className="slider-row">
          <input
            type="range"
            min={8}
            max={120}
            step={1}
            value={params.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
          />
          <input
            type="number"
            min={8}
            max={120}
            value={params.fontSize}
            onChange={(e) => {
              const v = Math.max(8, Math.min(120, Number(e.target.value)));
              update({ fontSize: v });
            }}
          />
        </div>
      </div>

      <div className="param-group">
        <label>行高: {params.lineHeight.toFixed(1)}</label>
        <div className="slider-row">
          <input
            type="range"
            min={1.0}
            max={3.0}
            step={0.1}
            value={params.lineHeight}
            onChange={(e) => update({ lineHeight: Number(e.target.value) })}
          />
          <input
            type="number"
            min={1.0}
            max={3.0}
            step={0.1}
            value={params.lineHeight}
            onChange={(e) => {
              const v = Math.max(1.0, Math.min(3.0, Number(e.target.value)));
              update({ lineHeight: v });
            }}
          />
        </div>
      </div>

      <div className="param-group">
        <label>字间距: {params.letterSpacing}px</label>
        <div className="slider-row">
          <input
            type="range"
            min={-2}
            max={10}
            step={0.5}
            value={params.letterSpacing}
            onChange={(e) =>
              update({ letterSpacing: Number(e.target.value) })
            }
          />
          <input
            type="number"
            min={-2}
            max={10}
            step={0.5}
            value={params.letterSpacing}
            onChange={(e) => {
              const v = Math.max(-2, Math.min(10, Number(e.target.value)));
              update({ letterSpacing: v });
            }}
          />
        </div>
      </div>

      <div className="param-group">
        <label>对齐方式</label>
        <div className="alignment-group">
          {(['left', 'center', 'right'] as Alignment[]).map((a) => (
            <button
              key={a}
              className={`alignment-btn${params.alignment === a ? ' active' : ''}`}
              onClick={() => update({ alignment: a })}
            >
              {a === 'left' ? '左对齐' : a === 'center' ? '居中' : '右对齐'}
            </button>
          ))}
        </div>
      </div>

      <div className="section-divider" />

      <div className="param-group">
        <label>预览文本</label>
        <textarea
          value={params.text}
          onChange={(e) => update({ text: e.target.value })}
        />
      </div>

      <div className="section-divider" />

      <button
        className={`action-btn ${compareMode ? 'secondary' : 'primary'}`}
        onClick={onToggleCompare}
      >
        {compareMode ? '关闭对比' : '开启对比'}
      </button>

      <button className="action-btn export-btn" onClick={onExport}>
        导出报告
      </button>
    </div>
  );
};

export default ControlPanel;
