import { useState } from 'react';
import {
  Pencil,
  Square,
  Circle,
  Type,
  Undo2,
  Redo2,
  Menu,
  X,
} from 'lucide-react';
import type { ToolType } from './types';

interface ToolbarProps {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const PRESET_COLORS = [
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

const TOOLS: { value: ToolType; icon: typeof Pencil; label: string }[] = [
  { value: 'brush', icon: Pencil, label: '画笔' },
  { value: 'rectangle', icon: Square, label: '矩形' },
  { value: 'circle', icon: Circle, label: '圆形' },
  { value: 'text', icon: Type, label: '文本' },
];

export default function Toolbar({
  tool,
  color,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <>
      <div className="tb-section">
        <div className="tb-label">工具</div>
        <div className="tb-tools-grid">
          {TOOLS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              className={`tb-btn tb-tool-btn ${tool === value ? 'active' : ''}`}
              title={label}
              onClick={() => {
                onToolChange(value);
                setMobileOpen(false);
              }}
            >
              <Icon size={20} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>

      <div className="tb-section">
        <div className="tb-label">颜色</div>
        <div className="tb-colors">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={`tb-color-swatch ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => onColorChange(c)}
            />
          ))}
        </div>
      </div>

      <div className="tb-section">
        <div className="tb-label">粗细: {strokeWidth}px</div>
        <input
          type="range"
          min={1}
          max={20}
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className="tb-range"
        />
      </div>

      <div className="tb-section">
        <div className="tb-label">操作</div>
        <div className="tb-actions">
          <button
            className="tb-btn"
            title="撤销 (Ctrl+Z)"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 size={20} strokeWidth={2} />
          </button>
          <button
            className="tb-btn"
            title="重做 (Ctrl+Shift+Z)"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="toolbar-desktop">{content}</aside>

      <div className={`toolbar-mobile-fab ${mobileOpen ? 'hidden' : ''}`}>
        <button className="tb-fab-btn" onClick={() => setMobileOpen(true)}>
          <Menu size={24} strokeWidth={2} />
        </button>
      </div>

      {mobileOpen && (
        <div className="toolbar-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="toolbar-mobile-panel" onClick={(e) => e.stopPropagation()}>
            <div className="tb-mobile-header">
              <span>工具栏</span>
              <button className="tb-btn" onClick={() => setMobileOpen(false)}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
