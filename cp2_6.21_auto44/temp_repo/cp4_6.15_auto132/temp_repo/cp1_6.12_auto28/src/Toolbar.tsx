import React from 'react';
import { ToolType } from './types';

interface ToolbarProps {
  currentTool: ToolType;
  setCurrentTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
}

const colors = ['#000000', '#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#ffffff'];

const tools: { type: ToolType; icon: string; title: string; cursor: string }[] = [
  { type: 'pen', icon: '✏️', title: '画笔', cursor: 'crosshair' },
  { type: 'rectangle', icon: '▭', title: '矩形', cursor: 'crosshair' },
  { type: 'circle', icon: '◯', title: '圆形', cursor: 'crosshair' },
  { type: 'text', icon: 'T', title: '文本', cursor: 'text' },
  { type: 'eraser', icon: '🧹', title: '橡皮擦', cursor: 'cell' },
];

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setCurrentTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: '72px',
        backgroundColor: '#ffffff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        zIndex: 100,
        gap: '8px',
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => setCurrentTool(tool.type)}
          title={tool.title}
          style={{
            width: '44px',
            height: '44px',
            border: currentTool === tool.type ? '2px solid #1976d2' : '2px solid transparent',
            borderRadius: '8px',
            backgroundColor: currentTool === tool.type ? '#e3f2fd' : '#fafafa',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
        >
          {tool.icon}
        </button>
      ))}

      <div style={{ height: '1px', width: '44px', backgroundColor: '#e0e0e0', margin: '12px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 8px' }}>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: c,
              border: color === c ? '3px solid #1976d2' : '2px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              padding: 0,
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
      </div>

      <div style={{ height: '1px', width: '44px', backgroundColor: '#e0e0e0', margin: '12px 0' }} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '0 8px',
        }}
      >
        <span style={{ fontSize: '11px', color: '#666' }}>线宽</span>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          style={{
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: '24px',
            height: '100px',
            cursor: 'pointer',
            accentColor: '#1976d2',
          }}
        />
        <span style={{ fontSize: '11px', color: '#333', fontWeight: 600 }}>{strokeWidth}</span>
      </div>
    </div>
  );
};

export default Toolbar;
