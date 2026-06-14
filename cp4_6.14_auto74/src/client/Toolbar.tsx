import React from 'react';
import { useBoardStore, ToolMode } from './Store';

const tools: { mode: ToolMode; icon: string; label: string }[] = [
  { mode: 'select', icon: '👆', label: '选择' },
  { mode: 'add-card', icon: '➕', label: '新建' },
  { mode: 'connect', icon: '🔗', label: '连线' },
  { mode: 'delete', icon: '🗑️', label: '删除' },
];

interface ToolbarProps {
  onSaveSnapshot: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSaveSnapshot }) => {
  const toolMode = useBoardStore((s) => s.toolMode);
  const setToolMode = useBoardStore((s) => s.setToolMode);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 48,
        bottom: 0,
        width: 60,
        background: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        gap: 4,
        zIndex: 100,
        borderRight: '1px solid #334155',
      }}
    >
      {tools.map((tool) => {
        const isActive = toolMode === tool.mode;
        return (
          <button
            key={tool.mode}
            onClick={() => setToolMode(tool.mode)}
            style={{
              width: 48,
              height: 48,
              border: 'none',
              borderRadius: 8,
              background: isActive ? '#3b82f6' : '#f8fafc',
              color: isActive ? '#ffffff' : '#334155',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              gap: 2,
              transition: 'all 150ms ease',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }
            }}
          >
            <span style={{ fontSize: 18 }}>{tool.icon}</span>
            <span style={{ fontSize: 9 }}>{tool.label}</span>
          </button>
        );
      })}

      <div style={{ width: 36, height: 1, background: '#334155', margin: '4px 0' }} />

      <button
        onClick={onSaveSnapshot}
        style={{
          width: 48,
          height: 48,
          border: 'none',
          borderRadius: 8,
          background: '#f8fafc',
          color: '#334155',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          gap: 2,
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <span style={{ fontSize: 18 }}>📷</span>
        <span style={{ fontSize: 9 }}>快照</span>
      </button>
    </div>
  );
};
