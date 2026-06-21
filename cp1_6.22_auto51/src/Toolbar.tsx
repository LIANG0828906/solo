import React, { useState } from 'react';
import {
  Pencil,
  StickyNote,
  Undo2,
  Redo2,
  Trash2,
  Circle,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Users,
} from 'lucide-react';
import type { ToolbarState } from './types';
import { PALETTE_COLORS, THICKNESS_OPTIONS } from './types';
import type { ConnectionStatus } from './WebSocketManager';

interface ToolbarProps {
  state: ToolbarState;
  onChange: (next: Partial<ToolbarState>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onAddNote: () => void;
  status: ConnectionStatus;
  userCount: number;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  state,
  onChange,
  onUndo,
  onRedo,
  onClear,
  onAddNote,
  status,
  userCount,
  canUndo,
  canRedo,
}) => {
  const [colorOpen, setColorOpen] = useState(false);
  const [thicknessOpen, setThicknessOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(true);
  const [clearing, setClearing] = useState(false);

  const handleClear = () => {
    setClearing(true);
    onClear();
    setTimeout(() => setClearing(false), 800);
  };

  const statusColor =
    status === 'connected'
      ? '#22c55e'
      : status === 'connecting' || status === 'reconnecting'
        ? '#f59e0b'
        : '#ef4444';

  const StatusIcon = status === 'connected' ? Wifi : WifiOff;

  const toolBtn = (active: boolean) =>
    `toolbar-btn ${active ? 'active' : ''}`;

  return (
    <>
      <style>{css}</style>

      <div className="toolbar-wrap">
        <div className="toolbar-status-bar">
          <div className="status-item">
            <StatusIcon size={14} style={{ color: statusColor }} />
            <span style={{ color: statusColor, fontSize: 11, fontWeight: 500 }}>
              {status === 'connected'
                ? '已连接'
                : status === 'connecting'
                  ? '连接中…'
                  : status === 'reconnecting'
                    ? '重连中…'
                    : '已断开'}
            </span>
          </div>
          <div className="status-item">
            <Users size={14} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
              {userCount} 人在线
            </span>
          </div>
        </div>

        <button
          className={`mobile-toggle ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>

        <div className={`toolbar-panel ${mobileOpen ? 'show' : ''}`}>
          <div className="tool-group">
            <button
              className={toolBtn(state.activeTool === 'pen')}
              onClick={() => onChange({ activeTool: 'pen' })}
              title="画笔"
            >
              <Pencil size={20} />
            </button>
            <button
              className={toolBtn(state.activeTool === 'note')}
              onClick={() => {
                onChange({ activeTool: 'note' });
                onAddNote();
                setTimeout(() => onChange({ activeTool: 'pen' }), 50);
              }}
              title="便签"
            >
              <StickyNote size={20} />
            </button>
          </div>

          <div className="divider" />

          <div className="tool-group color-group">
            <button
              className={`toolbar-btn color-picker ${colorOpen ? 'open' : ''}`}
              onClick={() => {
                setColorOpen((v) => !v);
                setThicknessOpen(false);
              }}
              title="颜色选择"
            >
              <span
                className="color-dot"
                style={{ background: state.activeColor }}
              />
              {colorOpen && (
                <div className="color-palette">
                  {PALETTE_COLORS.map((c, i) => (
                    <button
                      key={c}
                      className={`palette-item ${state.activeColor === c ? 'current' : ''}`}
                      style={{
                        background: c,
                        animationDelay: `${i * 40}ms`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({ activeColor: c });
                        setColorOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          </div>

          <div className="tool-group">
            <button
              className={`toolbar-btn thickness-picker ${thicknessOpen ? 'open' : ''}`}
              onClick={() => {
                setThicknessOpen((v) => !v);
                setColorOpen(false);
              }}
              title="粗细"
            >
              <span
                className="thickness-preview"
                style={{ width: state.thickness + 4, height: state.thickness + 4 }}
              />
              {thicknessOpen && (
                <div className="thickness-menu">
                  {THICKNESS_OPTIONS.map((t, i) => (
                    <button
                      key={t}
                      className={`thickness-item ${state.thickness === t ? 'current' : ''}`}
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({ thickness: t });
                        setThicknessOpen(false);
                      }}
                    >
                      <span
                        className="thick-dot"
                        style={{ width: t + 2, height: t + 2 }}
                      />
                      <span className="thick-label">{t}px</span>
                    </button>
                  ))}
                </div>
              )}
            </button>
          </div>

          <div className="divider" />

          <div className="tool-group">
            <button
              className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
              onClick={onUndo}
              disabled={!canUndo}
              title="撤销"
            >
              <Undo2 size={20} />
            </button>
            <button
              className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
              onClick={onRedo}
              disabled={!canRedo}
              title="重做"
            >
              <Redo2 size={20} />
            </button>
          </div>

          <div className="divider" />

          <div className="tool-group">
            <button
              className={`toolbar-btn clear-btn ${clearing ? 'animating' : ''}`}
              onClick={handleClear}
              title="清空画板"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const css = `
.toolbar-wrap {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolbar-status-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(22, 33, 62, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(233, 69, 96, 0.12);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 8px 32px rgba(0,0,0,0.35);
}
.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 10px;
  border-radius: 20px;
  background: rgba(22, 33, 62, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(233, 69, 96, 0.15);
  box-shadow:
    0 0 28px rgba(233, 69, 96, 0.12),
    0 8px 40px rgba(0,0,0,0.4),
    0 0 0 1px rgba(255,255,255,0.04) inset;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  position: relative;
}

.toolbar-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1),
              background 0.18s,
              color 0.18s,
              border-color 0.18s;
}
.toolbar-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  background: rgba(255,255,255,0.07);
  color: var(--text-primary);
  border-color: rgba(233, 69, 96, 0.25);
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}
.toolbar-btn:active:not(.disabled) {
  transform: scale(0.9);
  transition-duration: 80ms;
}
.toolbar-btn.active {
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.25), rgba(233, 69, 96, 0.08));
  color: var(--accent);
  border-color: rgba(233, 69, 96, 0.45);
  box-shadow: 0 0 18px rgba(233, 69, 96, 0.25), 0 0 0 1px rgba(233, 69, 96, 0.2) inset;
}
.toolbar-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.divider {
  width: 32px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
}

.color-picker { overflow: visible; }
.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.25);
  transition: transform 0.2s;
}
.color-picker.open .color-dot { transform: scale(1.08); }

.color-palette {
  position: absolute;
  left: calc(100% + 14px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(22, 33, 62, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(233, 69, 96, 0.2);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
  z-index: 10;
}
.palette-item {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transform: scale(0);
  opacity: 0;
  animation: palettePop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
}
.palette-item:hover {
  transform: scale(1.12) !important;
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.35);
}
.palette-item.current {
  border-color: #fff;
  box-shadow: 0 0 0 2px var(--accent);
}
@keyframes palettePop {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.thickness-picker { overflow: visible; }
.thickness-preview {
  border-radius: 50%;
  background: var(--text-primary);
  transition: all 0.2s;
}
.thickness-picker.open .thickness-preview { background: var(--accent); }

.thickness-menu {
  position: absolute;
  left: calc(100% + 14px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 14px;
  background: rgba(22, 33, 62, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(233, 69, 96, 0.2);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
  z-index: 10;
  min-width: 100px;
}
.thickness-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  opacity: 0;
  transform: translateX(-8px);
  animation: slideIn 0.25s ease-out forwards;
  transition: background 0.15s, color 0.15s;
}
.thickness-item:hover {
  background: rgba(255,255,255,0.06);
  color: var(--text-primary);
}
.thickness-item.current { color: var(--accent); }
.thick-dot {
  border-radius: 50%;
  background: var(--text-primary);
  flex-shrink: 0;
}
.thickness-item.current .thick-dot { background: var(--accent); }
.thick-label { font-size: 12px; font-weight: 500; }
@keyframes slideIn {
  to { opacity: 1; transform: translateX(0); }
}

.clear-btn { transition: all 0.2s; }
.clear-btn.animating {
  animation: clearShake 0.6s ease-out;
  color: var(--accent) !important;
  border-color: var(--accent) !important;
}
@keyframes clearShake {
  0%, 100% { transform: translateX(0) scale(1); }
  20% { transform: translateX(-3px) scale(0.94); }
  40% { transform: translateX(3px) scale(0.96); }
  60% { transform: translateX(-2px) scale(0.98); }
  80% { transform: translateX(1px) scale(1); }
}

.mobile-toggle {
  display: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(22, 33, 62, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(233, 69, 96, 0.25);
  color: var(--text-primary);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  align-self: center;
}

@media (max-width: 767px) {
  .toolbar-wrap {
    left: 0;
    right: 0;
    top: auto;
    bottom: 0;
    transform: none;
    padding: 10px 14px 16px;
    gap: 8px;
  }
  .toolbar-status-bar {
    flex-direction: row;
    justify-content: space-between;
    padding: 8px 14px;
  }
  .mobile-toggle { display: flex; }
  .toolbar-panel {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    padding: 12px;
    gap: 12px;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    padding-top: 0;
    padding-bottom: 0;
  }
  .toolbar-panel.show {
    max-height: 340px;
    opacity: 1;
    padding-top: 12px;
    padding-bottom: 12px;
    pointer-events: auto;
  }
  .tool-group { flex-direction: row; gap: 10px; }
  .divider { width: 1px; height: 28px; background: linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent); }
  .color-palette {
    left: 50%;
    top: auto;
    bottom: calc(100% + 10px);
    transform: translateX(-50%);
  }
  .thickness-menu {
    left: 50%;
    top: auto;
    bottom: calc(100% + 10px);
    transform: translateX(-50%);
  }
}
`;

export default Toolbar;
