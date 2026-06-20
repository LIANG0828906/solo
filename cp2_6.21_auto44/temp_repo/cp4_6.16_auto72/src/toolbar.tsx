import React from 'react';
import { useCanvasStore } from './store';
import { COLORS } from './types';
import type { ToolType, ConnectionStatus } from './types';

interface ToolbarProps {}

const tools: { type: ToolType; icon: string; label: string }[] = [
  { type: 'select', icon: '↖', label: '选择' },
  { type: 'pencil', icon: '✎', label: '铅笔' },
  { type: 'rectangle', icon: '▢', label: '矩形' },
  { type: 'stickyNote', icon: '❒', label: '便签' },
  { type: 'eraser', icon: '✕', label: '橡皮' },
];

export const Toolbar: React.FC<ToolbarProps> = () => {
  const currentTool = useCanvasStore((state) => state.currentTool);
  const currentColor = useCanvasStore((state) => state.currentColor);
  const connectionStatus = useCanvasStore((state) => state.connectionStatus);
  const undoStack = useCanvasStore((state) => state.undoStack);
  const redoStack = useCanvasStore((state) => state.redoStack);
  const setTool = useCanvasStore((state) => state.setTool);
  const setColor = useCanvasStore((state) => state.setColor);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);

  const statusColor =
    connectionStatus === 'connected'
      ? '#4CAF50'
      : connectionStatus === 'connecting'
      ? '#FFC107'
      : '#F44336';

  const statusLabel =
    connectionStatus === 'connected'
      ? '已连接'
      : connectionStatus === 'connecting'
      ? '连接中'
      : '已断开';

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="tool-group">
          {tools.map((tool) => (
            <button
              key={tool.type}
              className={`tool-btn ${currentTool === tool.type ? 'active' : ''}`}
              onClick={() => setTool(tool.type)}
              title={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>

        <div className="divider" />

        <div className="color-palette">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`color-btn ${currentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setColor(color)}
              title={color}
            />
          ))}
        </div>

        <div className="divider" />

        <div className="history-group">
          <button
            className={`tool-btn ${undoStack.length === 0 ? 'disabled' : ''}`}
            onClick={undo}
            disabled={undoStack.length === 0}
            title="撤销 (Ctrl+Z)"
          >
            <span className="tool-icon">↶</span>
            <span className="tool-label">撤销</span>
          </button>
          <button
            className={`tool-btn ${redoStack.length === 0 ? 'disabled' : ''}`}
            onClick={redo}
            disabled={redoStack.length === 0}
            title="重做 (Ctrl+Shift+Z)"
          >
            <span className="tool-icon">↷</span>
            <span className="tool-label">重做</span>
          </button>
        </div>
      </div>

      <div className="toolbar-right">
        <div className="connection-status">
          <span
            className="status-dot"
            style={{ backgroundColor: statusColor }}
          />
          <span className="status-text">{statusLabel}</span>
        </div>
      </div>
    </div>
  );
};
