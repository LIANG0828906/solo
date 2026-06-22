import React from 'react';
import { useApp } from './App';
import { ToolType } from './types';

const tools: { type: ToolType; label: string; icon: string }[] = [
  { type: 'select', label: '选择', icon: '↖' },
  { type: 'rectangle', label: '矩形', icon: '▭' },
  { type: 'circle', label: '圆形', icon: '○' },
  { type: 'arrow', label: '箭头', icon: '→' },
  { type: 'text', label: '文本', icon: 'T' }
];

export default function Toolbar() {
  const { state, dispatch } = useApp();

  return (
    <div
      style={{
        width: 60,
        backgroundColor: '#333',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: 4,
        flexShrink: 0,
        userSelect: 'none'
      }}
    >
      {tools.map(tool => {
        const isActive = state.selectedTool === tool.type;
        return (
          <button
            key={tool.type}
            title={tool.label}
            onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.type })}
            style={{
              width: 44,
              height: 44,
              borderRadius: 6,
              backgroundColor: isActive ? '#555' : 'transparent',
              color: 'white',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s, transform 0.2s',
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = '#555';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {tool.icon}
          </button>
        );
      })}

      <div
        style={{
          marginTop: 'auto',
          color: '#888',
          fontSize: 10,
          textAlign: 'center',
          padding: '8px 4px',
          lineHeight: 1.4
        }}
      >
        <div style={{ marginBottom: 4 }}>滚轮</div>
        <div>缩放</div>
        <div style={{ marginTop: 8, marginBottom: 4 }}>拖拽</div>
        <div>平移</div>
      </div>
    </div>
  );
}
