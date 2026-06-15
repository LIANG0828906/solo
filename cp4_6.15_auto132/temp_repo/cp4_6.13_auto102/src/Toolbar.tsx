import React, { useState, useEffect } from 'react';
import { ToolType } from './types';

interface ToolbarProps {
  tool: ToolType;
  color: string;
  thickness: number;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const PRESET_COLORS = [
  '#ffffff',
  '#00e676',
  '#ff5252',
  '#448aff',
  '#ffd740',
  '#e040fb',
  '#ff6e40',
  '#18ffff',
];

const TOOLS: Array<{ type: ToolType; icon: string; label: string }> = [
  { type: 'pen', icon: '✏️', label: '画笔' },
  { type: 'line', icon: '📏', label: '直线' },
  { type: 'rectangle', icon: '⬜', label: '矩形' },
  { type: 'circle', icon: '⭕', label: '圆形' },
  { type: 'text', icon: '📝', label: '文字' },
  { type: 'eraser', icon: '🧹', label: '橡皮' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  color,
  thickness,
  onToolChange,
  onColorChange,
  onThicknessChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [colorPanelOpen, setColorPanelOpen] = useState(true);
  const [thicknessPanelOpen, setThicknessPanelOpen] = useState(true);
  const [clickFeedback, setClickFeedback] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const triggerClick = (key: string) => {
    setClickFeedback(key);
    setTimeout(() => setClickFeedback(null), 150);
  };

  const handleToolClick = (t: ToolType) => {
    triggerClick(`tool-${t}`);
    onToolChange(t);
  };

  const toolbarContent = (
    <>
      <div className="toolbar-header">
        <div className="toolbar-title">
          <span className="title-icon">🎨</span>
          <span>CollabrDraw</span>
        </div>
        {!isNarrow && (
          <button
            className={`toolbar-collapse ${clickFeedback === 'collapse' ? 'clicking' : ''}`}
            onClick={() => {
              triggerClick('collapse');
              setIsExpanded((v) => !v);
            }}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        )}
      </div>

      <div className={`toolbar-tools ${!isExpanded && !isNarrow ? 'collapsed' : ''}`}>
        <div className="tools-label">工具</div>
        <div className="tools-grid">
          {TOOLS.map((t) => (
            <button
              key={t.type}
              className={`tool-btn ${tool === t.type ? 'active' : ''} ${
                clickFeedback === `tool-${t.type}` ? 'clicking' : ''
              }`}
              onClick={() => handleToolClick(t.type)}
              title={t.label}
            >
              <span className="tool-icon">{t.icon}</span>
              {(isExpanded || isNarrow) && <span className="tool-label">{t.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className={`toolbar-section ${!isExpanded && !isNarrow ? 'collapsed' : ''}`}>
        <button
          className={`section-header ${clickFeedback === 'color' ? 'clicking' : ''}`}
          onClick={() => {
            triggerClick('color');
            setColorPanelOpen((v) => !v);
          }}
        >
          <span className="section-title">
            <span className="section-icon">🎨</span>
            <span>颜色</span>
          </span>
          <span
            className="color-preview"
            style={{ backgroundColor: color, border: `2px solid ${color === '#ffffff' ? '#666' : color}` }}
          />
          <span className={`chevron ${colorPanelOpen ? 'open' : ''}`}>▼</span>
        </button>
        <div className={`section-content ${colorPanelOpen ? 'open' : ''}`}>
          <div className="color-presets">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${color === c ? 'selected' : ''} ${
                  clickFeedback === `color-${c}` ? 'clicking' : ''
                }`}
                style={{ backgroundColor: c, borderColor: c === '#ffffff' ? '#666' : c }}
                onClick={() => {
                  triggerClick(`color-${c}`);
                  onColorChange(c);
                }}
                title={c}
              />
            ))}
          </div>
          <label className="custom-color">
            <span>自定义颜色</span>
            <input type="color" value={color} onChange={(e) => onColorChange(e.target.value)} />
          </label>
        </div>
      </div>

      <div className={`toolbar-section ${!isExpanded && !isNarrow ? 'collapsed' : ''}`}>
        <button
          className={`section-header ${clickFeedback === 'thickness' ? 'clicking' : ''}`}
          onClick={() => {
            triggerClick('thickness');
            setThicknessPanelOpen((v) => !v);
          }}
        >
          <span className="section-title">
            <span className="section-icon">📐</span>
            <span>粗细</span>
          </span>
          <span className="thickness-value">{thickness}px</span>
          <span className={`chevron ${thicknessPanelOpen ? 'open' : ''}`}>▼</span>
        </button>
        <div className={`section-content ${thicknessPanelOpen ? 'open' : ''}`}>
          <div className="thickness-control">
            <div className="thickness-preview">
              <div
                className="thickness-dot"
                style={{
                  width: thickness,
                  height: thickness,
                  backgroundColor: color,
                }}
              />
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={thickness}
              onChange={(e) => onThicknessChange(Number(e.target.value))}
              className="thickness-slider"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${
                  ((thickness - 1) / 19) * 100
                }%, #3a3a3a ${((thickness - 1) / 19) * 100}%, #3a3a3a 100%)`,
              }}
            />
            <div className="thickness-range">
              <span>1px</span>
              <span>20px</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`toolbar-section ${!isExpanded && !isNarrow ? 'collapsed' : ''}`}>
        <div className="section-header static">
          <span className="section-title">
            <span className="section-icon">↩️</span>
            <span>操作</span>
          </span>
        </div>
        <div className="section-content open">
          <div className="action-row">
            <button
              className={`action-btn ${clickFeedback === 'undo' ? 'clicking' : ''} ${!canUndo ? 'disabled' : ''}`}
              disabled={!canUndo}
              onClick={() => {
                triggerClick('undo');
                onUndo();
              }}
              title="撤销 (Ctrl+Z)"
            >
              <span>↶</span>
              <span>撤销</span>
            </button>
            <button
              className={`action-btn ${clickFeedback === 'redo' ? 'clicking' : ''} ${!canRedo ? 'disabled' : ''}`}
              disabled={!canRedo}
              onClick={() => {
                triggerClick('redo');
                onRedo();
              }}
              title="重做 (Ctrl+Y)"
            >
              <span>↷</span>
              <span>重做</span>
            </button>
          </div>
        </div>
      </div>

      {(isExpanded || isNarrow) && (
        <div className="toolbar-footer">
          <div className="hint-text">💡 提示：Ctrl+Z 撤销 / Ctrl+Y 重做</div>
        </div>
      )}
    </>
  );

  if (isNarrow) {
    return (
      <>
        <button
          className={`floating-toolbar-toggle ${clickFeedback === 'float' ? 'clicking' : ''}`}
          onClick={() => {
            triggerClick('float');
            setFloatingOpen((v) => !v);
          }}
        >
          🎨 工具栏
        </button>
        {floatingOpen && (
          <div className="floating-toolbar-backdrop" onClick={() => setFloatingOpen(false)}>
            <aside className="toolbar narrow-open" onClick={(e) => e.stopPropagation()}>
              {toolbarContent}
            </aside>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className={`toolbar ${isExpanded ? 'expanded' : 'collapsed-side'}`}>
      {toolbarContent}
    </aside>
  );
};
