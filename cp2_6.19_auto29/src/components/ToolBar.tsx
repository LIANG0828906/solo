import React from 'react';
import { ToolType, useEditorStore, STICKERS, FONT_FAMILIES } from '../store/editorStore';
import './ToolBar.css';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, icon, label, isActive, onClick }) => {
  return (
    <button
      className={`tool-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={label}
    >
      <span className="tool-icon">{icon}</span>
      <span className="tool-label">{label}</span>
    </button>
  );
};

const ToolBar: React.FC = () => {
  const {
    currentTool,
    setCurrentTool,
    brushSize,
    setBrushSize,
    textColor,
    setTextColor,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    currentSticker,
    setCurrentSticker,
  } = useEditorStore();

  const tools: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    {
      tool: 'select',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
      label: '选择',
    },
    {
      tool: 'text',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
      label: '文字',
    },
    {
      tool: 'brush',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v7" />
          <path d="M10 17a2 2 0 0 1 4 0v3h-4Z" />
        </svg>
      ),
      label: '画笔',
    },
    {
      tool: 'sticker',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
      label: '贴纸',
    },
  ];

  const handleToolClick = (tool: ToolType) => {
    setCurrentTool(tool);
  };

  return (
    <div className="toolbar-container">
      <div className="toolbar-main">
        <div className="tools-row">
          {tools.map((t) => (
            <ToolButton
              key={t.tool}
              tool={t.tool}
              icon={t.icon}
              label={t.label}
              isActive={currentTool === t.tool}
              onClick={() => handleToolClick(t.tool)}
            />
          ))}
        </div>

        <div className="tool-panel-container">
          <div className={`tool-panel ${currentTool === 'select' ? 'visible' : ''}`} data-tool="select">
            <span className="panel-hint">拖拽移动元素，滚轮缩放画布</span>
          </div>

          <div className={`tool-panel ${currentTool === 'text' ? 'visible' : ''}`} data-tool="text">
            <div className="panel-group">
              <label className="panel-label">字体</label>
              <select
                className="panel-select"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="panel-group">
              <label className="panel-label">字号</label>
              <input
                type="range"
                min="12"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="panel-range"
              />
              <span className="panel-value">{fontSize}px</span>
            </div>
            <div className="panel-group">
              <label className="panel-label">颜色</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="panel-color"
              />
            </div>
          </div>

          <div className={`tool-panel ${currentTool === 'brush' ? 'visible' : ''}`} data-tool="brush">
            <div className="panel-group">
              <label className="panel-label">粗细</label>
              <div className="brush-sizes">
                {[2, 3, 4, 5].map((size) => (
                  <button
                    key={size}
                    className={`brush-size-btn ${brushSize === size ? 'active' : ''}`}
                    onClick={() => setBrushSize(size)}
                    title={`${size}px`}
                  >
                    <span className="brush-dot" style={{ width: size * 2, height: size * 2 }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-group">
              <label className="panel-label">颜色</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="panel-color"
              />
            </div>
          </div>

          <div className={`tool-panel ${currentTool === 'sticker' ? 'visible' : ''}`} data-tool="sticker">
            <div className="sticker-grid">
              {STICKERS.map((sticker) => (
                <button
                  key={sticker}
                  className={`sticker-btn ${currentSticker === sticker ? 'active' : ''}`}
                  onClick={() => setCurrentSticker(sticker)}
                >
                  <span className="sticker-emoji">{sticker}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolBar;
