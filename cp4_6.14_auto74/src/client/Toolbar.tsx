import React, { memo } from 'react';
import { useBoardStore, ToolMode } from './Store';

const tools: { mode: ToolMode; icon: string; label: string }[] = [
  { mode: 'select', icon: '👆', label: '选择' },
  { mode: 'add-card', icon: '➕', label: '新建' },
  { mode: 'connect', icon: '🔗', label: '连线' },
  { mode: 'delete', icon: '🗑️', label: '删除' },
];

interface ToolbarProps {
  onSaveSnapshot: () => void;
  onToggleSnapshots: () => void;
  snapshotCount: number;
}

export const Toolbar = memo(function Toolbar({
  onSaveSnapshot,
  onToggleSnapshots,
  snapshotCount,
}: ToolbarProps) {
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
              gap: 0,
              transition: 'all 150ms ease',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              filter: isActive ? 'brightness(1.1)' : 'none',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              if (!isActive) {
                el.style.background = '#e2e8f0';
                el.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              if (!isActive) {
                el.style.background = '#f8fafc';
                el.style.transform = 'scale(1)';
              }
            }}
            title={`${tool.label} 工具`}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{tool.icon}</span>
            <span style={{ fontSize: 9, lineHeight: 1, marginTop: 2 }}>{tool.label}</span>
          </button>
        );
      })}

      <div style={{ width: 36, height: 1, background: '#334155', margin: '6px 0' }} />

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
          gap: 0,
          transition: 'all 150ms ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        title="保存快照"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>📷</span>
        <span style={{ fontSize: 9, lineHeight: 1, marginTop: 2 }}>快照</span>
      </button>

      <button
        onClick={onToggleSnapshots}
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
          gap: 0,
          transition: 'all 150ms ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        title="查看历史快照"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>�</span>
        <span style={{ fontSize: 9, lineHeight: 1, marginTop: 2 }}>历史</span>
        {snapshotCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: '#ef4444',
              color: '#ffffff',
              fontSize: 9,
              borderRadius: 8,
              padding: '1px 4px',
              minWidth: 16,
              textAlign: 'center',
            }}
          >
            {snapshotCount}
          </span>
        )}
      </button>
    </div>
  );
});
