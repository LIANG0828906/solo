import React, { useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import type { ToolType } from '../types';

const tools: { type: ToolType; label: string; icon: string }[] = [
  { type: 'brush', label: '画笔', icon: '✏️' },
  { type: 'rectangle', label: '矩形', icon: '▭' },
  { type: 'circle', label: '圆形', icon: '○' },
  { type: 'line', label: '直线', icon: '／' },
  { type: 'eraser', label: '橡皮擦', icon: '🧽' },
  { type: 'note', label: '便签', icon: '📝' },
];

const colors = [
  '#333333',
  '#E53935',
  '#FB8C00',
  '#FDD835',
  '#43A047',
  '#1E88E5',
  '#8E24AA',
  '#FFFFFF',
];

const Toolbar: React.FC = () => {
  const {
    currentTool,
    currentColor,
    lineWidth,
    setCurrentTool,
    setCurrentColor,
    setLineWidth,
    undo,
    redo,
    past,
    future,
  } = useCanvasStore();

  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (tool: ToolType) => {
    setCurrentTool(tool);
  };

  const handleColorClick = (color: string) => {
    setCurrentColor(color);
  };

  return (
    <div
      style={{
        height: 60,
        backgroundColor: '#F5F5F5',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 'bold', fontSize: 18, color: '#1976D2' }}>
          DrawRipple
        </span>
      </div>

      <div
        style={{
          width: 1,
          height: 40,
          backgroundColor: '#E0E0E0',
          margin: '0 8px',
        }}
      />

      <div style={{ display: 'flex', gap: 6 }}>
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => handleToolClick(tool.type)}
            title={tool.label}
            style={{
              width: 48,
              height: 48,
              border: currentTool === tool.type ? '2px solid #1976D2' : '1px solid #E0E0E0',
              borderRadius: 8,
              backgroundColor: currentTool === tool.type ? '#E3F2FD' : '#FFFFFF',
              cursor: 'pointer',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div
        style={{
          width: 1,
          height: 40,
          backgroundColor: '#E0E0E0',
          margin: '0 8px',
        }}
      />

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: currentColor === color ? '2px solid #1976D2' : '1px solid #E0E0E0',
              backgroundColor: color,
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.9)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
          />
        ))}
        <button
          onClick={() => colorInputRef.current?.click()}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid #E0E0E0',
            background: 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="自定义颜色"
        >
          +
        </button>
        <input
          ref={colorInputRef}
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          style={{ display: 'none' }}
        />
      </div>

      <div
        style={{
          width: 1,
          height: 40,
          backgroundColor: '#E0E0E0',
          margin: '0 8px',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#666' }}>线宽:</span>
        <input
          type="range"
          min="1"
          max="30"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          style={{
            width: 80,
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: 12, color: '#666', width: 20 }}>{lineWidth}</span>
      </div>

      <div
        style={{
          width: 1,
          height: 40,
          backgroundColor: '#E0E0E0',
          margin: '0 8px',
        }}
      />

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={undo}
          disabled={past.length === 0}
          title="撤销 (Ctrl+Z)"
          style={{
            width: 48,
            height: 48,
            border: '1px solid #E0E0E0',
            borderRadius: 8,
            backgroundColor: past.length === 0 ? '#F5F5F5' : '#FFFFFF',
            cursor: past.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            opacity: past.length === 0 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (past.length > 0) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            if (past.length > 0) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            if (past.length > 0) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          title="重做 (Ctrl+Shift+Z)"
          style={{
            width: 48,
            height: 48,
            border: '1px solid #E0E0E0',
            borderRadius: 8,
            backgroundColor: future.length === 0 ? '#F5F5F5' : '#FFFFFF',
            cursor: future.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            opacity: future.length === 0 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (future.length > 0) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            if (future.length > 0) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            if (future.length > 0) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
        >
          ↪
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
