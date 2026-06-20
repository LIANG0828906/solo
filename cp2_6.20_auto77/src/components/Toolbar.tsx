import React, { useState } from 'react';
import { useStore } from '../store';
import { MechanismType, MECHANISM_LABELS, MECHANISM_COLORS } from '../types';

const MECHANISM_ICONS: Record<MechanismType, string> = {
  [MechanismType.PressurePlate]: '⬜',
  [MechanismType.LaserEmitter]: '🔺',
  [MechanismType.MovingPlatform]: '⬛',
  [MechanismType.Portal]: '⭕',
};

export function Toolbar() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const placingType = useStore((s) => s.placingType);
  const setPlacingType = useStore((s) => s.setPlacingType);
  const connectingFromId = useStore((s) => s.connectingFromId);
  const cancelConnecting = useStore((s) => s.cancelConnecting);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const resetLevel = useStore((s) => s.resetLevel);
  const saveLevel = useStore((s) => s.saveLevel);
  const loadLevel = useStore((s) => s.loadLevel);
  const loadExampleLevel = useStore((s) => s.loadExampleLevel);
  const undoStack = useStore((s) => s.undoStack);
  const redoStack = useStore((s) => s.redoStack);

  const [saveName, setSaveName] = useState('');
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);

  const handleSave = () => {
    if (saveName.trim()) {
      saveLevel(saveName.trim());
      setSaveName('');
    }
  };

  const handleLoad = () => {
    if (saveName.trim()) {
      const ok = loadLevel(saveName.trim());
      setLoadStatus(ok ? '加载成功!' : '未找到存档');
      setTimeout(() => setLoadStatus(null), 2000);
    }
  };

  const handleModeToggle = () => {
    setMode(mode === 'editor' ? 'run' : 'editor');
  };

  const btnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    border: '1px solid #444',
    borderRadius: '6px',
    background: isActive ? '#3a6ea5' : 'rgba(255,255,255,0.06)',
    color: '#e0e0e0',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    transition: 'background 0.2s, transform 0.1s',
    whiteSpace: 'nowrap' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  });

  const handleBtnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    if (!el.style.background.includes('3a6ea5')) {
      el.style.background = 'rgba(58,110,165,0.3)';
    }
  };

  const handleBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    if (!el.style.background.includes('3a6ea5')) {
      el.style.background = 'rgba(255,255,255,0.06)';
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.7)',
        borderBottom: '1px solid #333',
        backdropFilter: 'blur(8px)',
        flexWrap: 'wrap' as const,
      }}
    >
      <button
        style={btnStyle(mode === 'run')}
        onClick={handleModeToggle}
        onMouseEnter={handleBtnHover}
        onMouseLeave={handleBtnLeave}
      >
        {mode === 'editor' ? '▶ 运行模式' : '✏️ 编辑模式'}
      </button>

      <div style={{ width: '1px', height: '28px', background: '#444', margin: '0 4px' }} />

      {mode === 'editor' && (
        <>
          {connectingFromId && (
            <button
              style={{ ...btnStyle(true), background: '#884400' }}
              onClick={cancelConnecting}
            >
              ✕ 取消连接
            </button>
          )}

          {(Object.values(MechanismType) as MechanismType[]).map((type) => (
            <button
              key={type}
              style={btnStyle(placingType === type)}
              onClick={() => setPlacingType(placingType === type ? null : type)}
              onMouseEnter={handleBtnHover}
              onMouseLeave={handleBtnLeave}
            >
              <span>{MECHANISM_ICONS[type]}</span>
              <span>{MECHANISM_LABELS[type]}</span>
            </button>
          ))}

          <div style={{ width: '1px', height: '28px', background: '#444', margin: '0 4px' }} />

          <button
            style={btnStyle(false)}
            onClick={undo}
            disabled={undoStack.length === 0}
            onMouseEnter={handleBtnHover}
            onMouseLeave={handleBtnLeave}
          >
            ↩ 撤销
          </button>
          <button
            style={btnStyle(false)}
            onClick={redo}
            disabled={redoStack.length === 0}
            onMouseEnter={handleBtnHover}
            onMouseLeave={handleBtnLeave}
          >
            ↪ 重做
          </button>
          <button
            style={btnStyle(false)}
            onClick={resetLevel}
            onMouseEnter={handleBtnHover}
            onMouseLeave={handleBtnLeave}
          >
            🗑 重置
          </button>

          <div style={{ width: '1px', height: '28px', background: '#444', margin: '0 4px' }} />

          <button
            style={btnStyle(showSaveLoad)}
            onClick={() => setShowSaveLoad(!showSaveLoad)}
            onMouseEnter={handleBtnHover}
            onMouseLeave={handleBtnLeave}
          >
            💾 存档
          </button>
          <button
            style={btnStyle(false)}
            onClick={loadExampleLevel}
            onMouseEnter={handleBtnHover}
            onMouseLeave={handleBtnLeave}
          >
            📋 示例关卡
          </button>
        </>
      )}

      {showSaveLoad && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '4px',
          }}
        >
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="关卡名称"
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #555',
              background: '#1a1a2e',
              color: '#e0e0e0',
              fontSize: '12px',
              width: '100px',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          <button
            style={{ ...btnStyle(false), padding: '4px 10px', fontSize: '12px' }}
            onClick={handleSave}
            onMouseEnter={handleBtnHover}
            onMouseLeave={handleBtnLeave}
          >
            保存
          </button>
          <button
            style={{ ...btnStyle(false), padding: '4px 10px', fontSize: '12px' }}
            onClick={handleLoad}
            onMouseEnter={handleBtnHover}
            onMouseLeave={handleBtnLeave}
          >
            加载
          </button>
          {loadStatus && (
            <span style={{ fontSize: '12px', color: '#88ff88' }}>{loadStatus}</span>
          )}
        </div>
      )}

      {mode === 'run' && (
        <span style={{ fontSize: '12px', color: '#88aacc', marginLeft: '8px' }}>
          WASD 移动 | 站上压力板触发机关 | 进入传送门传送
        </span>
      )}
    </div>
  );
}
