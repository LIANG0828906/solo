import React from 'react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  selectedCount: number;
  onToolChange: (tool: ToolType) => void;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onFontSizeChange: (size: number) => void;
  onAlign: (align: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
}

const tools: { id: ToolType; name: string; icon: React.ReactNode }[] = [
  {
    id: 'select',
    name: '选择',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 2l16 8-7 2-2 7L4 2z" />
      </svg>
    )
  },
  {
    id: 'pen',
    name: '画笔',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      </svg>
    )
  },
  {
    id: 'rectangle',
    name: '矩形',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="1" />
      </svg>
    )
  },
  {
    id: 'diamond',
    name: '菱形',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l10 10-10 10L2 12z" />
      </svg>
    )
  },
  {
    id: 'arrow',
    name: '箭头',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h16M14 6l6 6-6 6" />
      </svg>
    )
  },
  {
    id: 'text',
    name: '文本',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
      </svg>
    )
  },
  {
    id: 'eraser',
    name: '橡皮',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 20H7L3 16c-2-2-2-6 0-8l8-8c2-2 6-2 8 0l5 5" />
        <path d="M18 18l4-4" />
      </svg>
    )
  }
];

const alignTools = [
  { id: 'left', name: '左对齐', icon: '⬅' },
  { id: 'centerH', name: '水平居中', icon: '↔' },
  { id: 'right', name: '右对齐', icon: '➡' },
  { id: 'top', name: '上对齐', icon: '⬆' },
  { id: 'centerV', name: '垂直居中', icon: '↕' },
  { id: 'bottom', name: '下对齐', icon: '⬇' }
];

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  strokeColor,
  fillColor,
  strokeWidth,
  fontSize,
  selectedCount,
  onToolChange,
  onStrokeColorChange,
  onFillColorChange,
  onStrokeWidthChange,
  onFontSizeChange,
  onAlign,
  onExportSVG,
  onExportPNG
}) => {
  return (
    <div className="toolbar">
      <div className="tool-section">
        <div className="tool-section-title">绘图工具</div>
        <div className="tool-buttons">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tool-button ${currentTool === tool.id ? 'active' : ''}`}
              onClick={() => onToolChange(tool.id)}
              title={tool.name}
            >
              <div className="tool-icon">{tool.icon}</div>
              <span>{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedCount > 1 && (
        <div className="tool-section fade-in">
          <div className="tool-section-title">对齐 ({selectedCount}个选中)</div>
          <div className="align-buttons">
            {alignTools.map(tool => (
              <button
                key={tool.id}
                className="align-button"
                onClick={() => onAlign(tool.id as any)}
                title={tool.name}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="tool-section">
        <div className="tool-section-title">样式设置</div>
        <div className="slider-container">
          <div className="slider-label">
            <span>线条颜色</span>
            <input
              type="color"
              className="color-picker"
              value={strokeColor}
              onChange={(e) => onStrokeColorChange(e.target.value)}
              style={{ width: '30px', height: '20px', padding: 0, border: 'none' }}
            />
          </div>
        </div>
        <div className="slider-container">
          <div className="slider-label">
            <span>填充颜色</span>
            <input
              type="color"
              className="color-picker"
              value={fillColor.startsWith('rgba') ? '#FFFFFF' : fillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              style={{ width: '30px', height: '20px', padding: 0, border: 'none' }}
            />
          </div>
        </div>
        <div className="slider-container">
          <div className="slider-label">
            <span>线条粗细</span>
            <span>{strokeWidth}px</span>
          </div>
          <input
            type="range"
            className="slider"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          />
        </div>
        {currentTool === 'text' && (
          <div className="slider-container">
            <div className="slider-label">
              <span>字体大小</span>
              <span>{fontSize}px</span>
            </div>
            <input
              type="range"
              className="slider"
              min="12"
              max="48"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <div className="tool-section">
        <div className="tool-section-title">导出</div>
        <div className="export-buttons">
          <button className="export-btn" onClick={onExportSVG}>
            导出 SVG
          </button>
          <button className="export-btn" onClick={onExportPNG}>
            导出 PNG
          </button>
        </div>
      </div>

      <div className="tool-section" style={{ marginTop: 'auto', fontSize: '11px', color: '#999' }}>
        <div>💡 提示：</div>
        <div>• 空格键 + 拖拽平移画布</div>
        <div>• 滚轮缩放画布</div>
        <div>• Shift + 点击多选</div>
        <div>• Delete 删除选中</div>
      </div>
    </div>
  );
};

export default Toolbar;
