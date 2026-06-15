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
        width: 76,
        background: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 10,
        gap: 6,
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
              width: 56,
              height: 56,
              border: 'none',
              borderRadius: 10,
              background: isActive ? '#3b82f6' : '#f8fafc',
              color: isActive ? '#ffffff' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              transition: 'all 150ms ease',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              filter: isActive ? 'brightness(1.1)' : 'none',
              boxShadow: isActive
                ? '0 2px 12px rgba(59,130,246,0.4)'
                : '0 1px 2px rgba(0,0,0,0.1)',
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
            <span style={{ fontSize: 20, lineHeight: 1, display: 'block' }}>
              {tool.icon}
            </span>
            <span
              style={{
                fontSize: 12,
                lineHeight: 1,
                display: 'block',
                color: isActive ? '#ffffff' : '#64748b',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {tool.label}
            </span>
          </button>
        );
      })}

      <div style={{ width: 48, height: 1, background: '#334155', margin: '8px 0' }} />

      <button
        onClick={onSaveSnapshot}
        style={{
          width: 56,
          height: 56,
          border: 'none',
          borderRadius: 10,
          background: '#f8fafc',
          color: '#475569',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          transition: 'all 150ms ease',
          position: 'relative',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        title="保存当前快照"
      >
        <span style={{ fontSize: 20, lineHeight: 1, display: 'block' }}>📷</span>
        <span
          style={{
            fontSize: 12,
            lineHeight: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 500,
          }}
        >
          快照
        </span>
      </button>

      <button
        onClick={onToggleSnapshots}
        style={{
          width: 56,
          height: 56,
          border: 'none',
          borderRadius: 10,
          background: '#f8fafc',
          color: '#475569',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          transition: 'all 150ms ease',
          position: 'relative',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        title="查看历史快照列表"
      >
        <span style={{ fontSize: 20, lineHeight: 1, display: 'block' }}>📜</span>
        <span
          style={{
            fontSize: 12,
            lineHeight: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 500,
          }}
        >
          历史
        </span>
        {snapshotCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#ef4444',
              color: '#ffffff',
              fontSize: 11,
              borderRadius: 10,
              padding: '2px 6px',
              minWidth: 18,
              textAlign: 'center',
              fontWeight: 600,
              lineHeight: 1,
              boxShadow: '0 1px 4px rgba(239,68,68,0.4)',
            }}
          >
            {snapshotCount}
          </span>
        )}
      </button>
    </div>
  );
});
