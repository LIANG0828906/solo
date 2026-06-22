import React from 'react';
import type { ToolType } from '../types';
import { COLOR_PALETTE, BRUSH_SIZES } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  color: string;
  onColorChange: (color: string) => void;
  brushSize: 3 | 6 | 10;
  onBrushSizeChange: (size: 3 | 6 | 10) => void;
  highlightOpacity: number;
  onHighlightOpacityChange: (opacity: number) => void;
  showColorPanel: boolean;
  onToggleColorPanel: () => void;
  disabled: boolean;
}

const TOOL_ICONS: Record<ToolType, string> = {
  brush: '✏️',
  highlight: '🖍️',
  text: '📝',
  none: '🚫',
};

const TOOL_LABELS: Record<ToolType, string> = {
  brush: '画笔',
  highlight: '高亮',
  text: '文本',
  none: '无',
};

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  color,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  highlightOpacity,
  onHighlightOpacityChange,
  showColorPanel,
  onToggleColorPanel,
  disabled,
}) => {
  const tools: ToolType[] = ['brush', 'highlight', 'text'];

  return (
    <>
      <div className="toolbar">
        {tools.map((tool) => (
          <button
            key={tool}
            className={`tool-btn ${currentTool === tool ? 'active' : ''}`}
            onClick={() => onToolChange(tool)}
            disabled={disabled}
            title={TOOL_LABELS[tool]}
          >
            {TOOL_ICONS[tool]}
          </button>
        ))}
        <button
          className={`tool-btn ${showColorPanel ? 'active' : ''}`}
          onClick={onToggleColorPanel}
          disabled={disabled}
          title="颜色与设置"
        >
          🎨
        </button>
      </div>

      {showColorPanel && (
        <div className="color-panel">
          <div className="color-panel-title">选择颜色</div>
          <div className="color-grid">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                className={`color-swatch ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => onColorChange(c)}
                title={c}
              />
            ))}
          </div>

          {currentTool === 'brush' && (
            <div className="size-options">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  className={`size-btn ${brushSize === size ? 'active' : ''}`}
                  onClick={() => onBrushSizeChange(size)}
                >
                  {size}px
                </button>
              ))}
            </div>
          )}

          {currentTool === 'highlight' && (
            <div className="opacity-control">
              <div className="color-panel-title">透明度: {highlightOpacity.toFixed(1)}</div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.1"
                value={highlightOpacity}
                onChange={(e) => onHighlightOpacityChange(parseFloat(e.target.value))}
                className="zoom-slider"
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Toolbar;
