import { useState, useEffect } from 'react';
import type { ToolType, ToolConfig } from '@/types';
import { DEFAULT_COLOR_PALETTE } from '@/utils/helpers';

interface ControlPanelProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  toolConfigs: Record<ToolType, ToolConfig>;
  onConfigChange: (tool: ToolType, config: ToolConfig) => void;
}

const TOOL_LABELS: Record<ToolType, string> = {
  carve: '雕刻',
  stack: '堆叠',
  spray: '喷色',
  smooth: '平滑',
};

const TOOL_ICONS: Record<ToolType, string> = {
  carve: '⛏',
  stack: '✦',
  spray: '✺',
  smooth: '◉',
};

export function ControlPanel({
  currentTool,
  onToolChange,
  toolConfigs,
  onConfigChange,
}: ControlPanelProps) {
  const [animatingTool, setAnimatingTool] = useState<ToolType | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR_PALETTE[0]);

  useEffect(() => {
    if (currentTool) {
      setAnimatingTool(currentTool);
      const timer = setTimeout(() => setAnimatingTool(null), 300);
      return () => clearTimeout(timer);
    }
  }, [currentTool]);

  const handleToolClick = (tool: ToolType) => {
    onToolChange(tool);
  };

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onConfigChange(currentTool, {
      ...toolConfigs[currentTool],
      brushSize: value,
    });
  };

  const handleBrushStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onConfigChange(currentTool, {
      ...toolConfigs[currentTool],
      brushStrength: value,
    });
  };

  const config = toolConfigs[currentTool];

  return (
    <div className="control-panel">
      <div>
        <div className="panel-title">工具选择</div>
        <div className="tool-buttons">
          {(Object.keys(TOOL_LABELS) as ToolType[]).map((tool) => (
            <button
              key={tool}
              className={`tool-btn ${currentTool === tool ? 'active' : ''} ${animatingTool === tool ? 'animate-in' : ''}`}
              onClick={() => handleToolClick(tool)}
            >
              <span style={{ fontSize: '18px', display: 'block', marginBottom: '4px' }}>
                {TOOL_ICONS[tool]}
              </span>
              {TOOL_LABELS[tool]}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div>
        <div className="panel-title">{TOOL_LABELS[currentTool]} 参数</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <div className="slider-group">
            <div className="slider-label">
              <span>游标大小</span>
              <span className="slider-value">{config.brushSize.toFixed(1)}</span>
            </div>
            <input
              type="range"
              className="slider"
              min="0.5"
              max="5"
              step="0.1"
              value={config.brushSize}
              onChange={handleBrushSizeChange}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>强度</span>
              <span className="slider-value">{config.brushStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className="slider"
              min="0.1"
              max="2"
              step="0.05"
              value={config.brushStrength}
              onChange={handleBrushStrengthChange}
            />
          </div>
        </div>
      </div>

      {currentTool === 'spray' && (
        <>
          <div className="divider" />
          <div>
            <div className="panel-title">色板</div>
            <div className="color-palette">
              {DEFAULT_COLOR_PALETTE.map((color) => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      <div className="divider" />
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
        <div style={{ marginBottom: '4px' }}>提示：</div>
        <div>• 按住鼠标左键在3D视图中拖动进行雕刻</div>
        <div>• 按住 Shift + 鼠标拖动旋转视角</div>
        <div>• 滚轮缩放视图</div>
      </div>
    </div>
  );
}
