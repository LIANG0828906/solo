import React from 'react';
import { Tool } from '../shared/types';

interface ToolbarProps {
  currentTool: Tool;
  color: string;
  strokeWidth: number;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onAddSticky: () => void;
  onClearCanvas: () => void;
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#000000', '#ffffff'];
const THICKNESSES = [2, 4, 6, 8];
const TOOL_ICONS: Record<Tool, string> = {
  pen: '✏️',
  line: '📏',
  rect: '▭',
  sticky: '📝',
};

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  color,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onAddSticky,
  onClearCanvas,
}) => {
  return (
    <div className="toolbar glass-panel">
      <div className="tool-title">工具</div>
      {(['pen', 'line', 'rect'] as Tool[]).map((tool) => (
        <button
          key={tool}
          className={`tool-btn ${currentTool === tool ? 'active' : ''}`}
          onClick={() => onToolChange(tool)}
          title={
            tool === 'pen' ? '自由绘制' :
            tool === 'line' ? '画直线' : '画矩形'
          }
        >
          {TOOL_ICONS[tool]}
        </button>
      ))}
      <button
        className={`tool-btn`}
        onClick={onAddSticky}
        title="添加便利贴"
      >
        📝
      </button>

      <div className="tool-divider" />

      <div className="tool-title">颜色</div>
      <div className="color-picker">
        {COLORS.map((c) => (
          <div
            key={c}
            className={`color-swatch ${color === c ? 'active' : ''}`}
            style={{ backgroundColor: c, color: c }}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>

      <div className="tool-divider" />

      <div className="tool-title">粗细</div>
      <div className="thickness-picker">
        {THICKNESSES.map((t) => (
          <div
            key={t}
            className={`thickness-option ${strokeWidth === t ? 'active' : ''}`}
            onClick={() => onStrokeWidthChange(t)}
            title={`${t}px`}
          >
            <div
              className="thickness-line"
              style={{ width: 24, height: t }}
            />
          </div>
        ))}
      </div>

      <div className="tool-divider" />

      <button
        className="tool-btn"
        onClick={onClearCanvas}
        title="清空画布"
        style={{ color: '#f87171' }}
      >
        🗑️
      </button>
    </div>
  );
};

export default Toolbar;
