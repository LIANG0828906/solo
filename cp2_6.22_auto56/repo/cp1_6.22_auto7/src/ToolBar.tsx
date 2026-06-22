import React, { useState } from 'react';
import type { Tool } from './utils';

interface ToolBarProps {
  currentTool: Tool;
  currentColor: string;
  brushSize: number;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  connected: boolean;
}

interface ToolButtonDef {
  id: Tool;
  label: string;
  icon: string;
}

const TOOLS: ToolButtonDef[] = [
  { id: 'pencil', label: '铅笔', icon: '✏️' },
  { id: 'eraser', label: '橡皮', icon: '🧹' },
  { id: 'eyedropper', label: '吸色', icon: '💧' },
  { id: 'fill', label: '填充', icon: '🪣' }
];

const ERASER_SIZES = [1, 3, 5];

const ToolBar: React.FC<ToolBarProps> = ({
  currentTool,
  currentColor,
  brushSize,
  onToolChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  connected
}) => {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const handlePress = (id: string, action: () => void) => {
    setPressedButton(id);
    action();
    setTimeout(() => setPressedButton(null), 150);
  };

  const buttonBaseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    gap: '4px',
    minWidth: '60px',
    transition: 'all 0.15s ease',
    fontSize: '18px',
    backgroundColor: '#3a3a3a',
    color: '#ccc',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  };

  const activeStyle: React.CSSProperties = {
    backgroundColor: '#ff6b6b',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(255,107,107,0.4)'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      backgroundColor: '#3a3a3a',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      overflowX: 'auto',
      flexShrink: 0
    }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        paddingRight: '16px',
        borderRight: '1px solid #4a4a4a'
      }}>
        {TOOLS.map((tool) => {
          const isActive = currentTool === tool.id;
          const isPressed = pressedButton === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handlePress(tool.id, () => onToolChange(tool.id))}
              title={tool.label}
              style={{
                ...buttonBaseStyle,
                ...(isActive ? activeStyle : {}),
                ...(isPressed ? { transform: 'translateY(2px)', boxShadow: '0 0 2px rgba(0,0,0,0.3)' } : {})
              }}
            >
              <span>{tool.icon}</span>
              <span style={{ fontSize: '11px' }}>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {currentTool === 'eraser' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingRight: '16px',
          borderRight: '1px solid #4a4a4a'
        }}>
          <span style={{ fontSize: '12px', color: '#999' }}>橡皮大小:</span>
          {ERASER_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onBrushSizeChange(size)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: brushSize === size ? '#4ecdc4' : '#4a4a4a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.15s ease',
                boxShadow: brushSize === size ? '0 2px 8px rgba(78,205,196,0.4)' : '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              {size}x{size}
            </button>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingRight: '16px',
        borderRight: '1px solid #4a4a4a'
      }}>
        <button
          onClick={() => handlePress('undo', onUndo)}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
          style={{
            ...buttonBaseStyle,
            minWidth: '50px',
            padding: '8px 12px',
            opacity: canUndo ? 1 : 0.4,
            cursor: canUndo ? 'pointer' : 'not-allowed',
            ...(pressedButton === 'undo' ? { transform: 'translateY(2px)', boxShadow: '0 0 2px rgba(0,0,0,0.3)' } : {})
          }}
        >
          ↩️
          <span style={{ fontSize: '11px' }}>撤销</span>
        </button>
        <button
          onClick={() => handlePress('redo', onRedo)}
          disabled={!canRedo}
          title="重做 (Ctrl+Y)"
          style={{
            ...buttonBaseStyle,
            minWidth: '50px',
            padding: '8px 12px',
            opacity: canRedo ? 1 : 0.4,
            cursor: canRedo ? 'pointer' : 'not-allowed',
            ...(pressedButton === 'redo' ? { transform: 'translateY(2px)', boxShadow: '0 0 2px rgba(0,0,0,0.3)' } : {})
          }}
        >
          ↪️
          <span style={{ fontSize: '11px' }}>重做</span>
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginLeft: 'auto'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: connected ? '#4ecdc4' : '#ff6b6b',
          boxShadow: connected ? '0 0 8px #4ecdc4' : '0 0 8px #ff6b6b'
        }} />
        <span style={{ fontSize: '12px', color: '#999' }}>
          {connected ? '已连接' : '本地模式'}
        </span>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: currentColor,
          border: currentColor === '#ffffff' ? '2px solid #555' : 'none',
          boxShadow: `0 0 8px ${currentColor}`
        }} />
      </div>
    </div>
  );
};

export default ToolBar;
