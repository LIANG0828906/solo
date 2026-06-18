import React from 'react';
import { useBoardStore } from '../stores/boardStore';
import type { Snapshot } from '../types';

const panelBaseStyle: React.CSSProperties = {
  position: 'fixed',
  right: 0,
  top: 0,
  width: 320,
  height: '100vh',
  background: '#F0EEF6',
  borderRadius: '16px 0 0 16px',
  boxShadow: '-4px 0 24px rgba(45,45,68,0.15)',
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
};

const headerStyle: React.CSSProperties = {
  padding: '24px 24px 16px',
  borderBottom: '1px solid #E0DDEB',
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 16px 24px',
};

const itemStyle = (active: boolean): React.CSSProperties => ({
  height: 60,
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  borderRadius: 12,
  cursor: 'pointer',
  marginBottom: 6,
  background: active ? 'rgba(108,92,231,0.12)' : 'transparent',
  border: active ? '1px solid rgba(108,92,231,0.3)' : '1px solid transparent',
  transition: 'background 0.15s ease, border-color 0.15s ease',
});

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  if (isToday) return `${hh}:${mm}:${ss}`;
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${mo}-${da} ${hh}:${mm}`;
};

interface VersionPanelProps {
  open: boolean;
  onClose: () => void;
}

export const VersionPanel: React.FC<VersionPanelProps> = ({ open, onClose }) => {
  const { snapshots, currentSnapshotIndex, restoreSnapshot } = useBoardStore();
  const reversedSnapshots = [...snapshots].reverse();
  const reversedCurrent = snapshots.length > 0 ? snapshots.length - 1 - currentSnapshotIndex : -1;

  return (
    <div
      style={{
        ...panelBaseStyle,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#6C5CE7" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="#6C5CE7" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2D2D44', margin: 0 }}>版本历史</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: '#6C5CE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(108,92,231,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#8A8AA8', margin: 0 }}>
          共 {snapshots.length} 个快照 · 点击任意版本切换
        </div>
      </div>

      <div style={listStyle}>
        {reversedSnapshots.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: '#8A8AA8',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 12px', opacity: 0.5 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#8A8AA8" strokeWidth="1.5" />
              <path d="M3 9h18" stroke="#8A8AA8" strokeWidth="1.5" />
              <path d="M8 2v4M16 2v4" stroke="#8A8AA8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 13 }}>暂无历史快照</div>
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>开始操作后将自动生成版本</div>
          </div>
        )}
        {reversedSnapshots.map((snap: Snapshot, i: number) => {
          const isActive = i === reversedCurrent;
          return (
            <div
              key={snap.id}
              style={itemStyle(isActive)}
              onClick={() => restoreSnapshot(snapshots.length - 1 - i)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(108,92,231,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{
                width: 50, height: 40, borderRadius: 8,
                background: snap.densityColor,
                marginRight: 14, flexShrink: 0,
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.15) 100%)`,
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#6C5CE7' : '#2D2D44',
                  marginBottom: 3,
                }}>
                  {formatTime(snap.timestamp)}
                  {isActive && (
                    <span style={{
                      marginLeft: 8, fontSize: 10, fontWeight: 500,
                      padding: '2px 6px', borderRadius: 4,
                      background: 'rgba(108,92,231,0.15)',
                      color: '#6C5CE7',
                    }}>
                      当前
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 11, color: '#8A8AA8',
                }}>
                  {snap.elements.length} 个元素
                </div>
              </div>
              {isActive && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#6C5CE7',
                  flexShrink: 0,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
