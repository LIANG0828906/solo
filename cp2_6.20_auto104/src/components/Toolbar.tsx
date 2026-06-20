import React, { useCallback } from 'react';
import { useEditorStore } from '@store/editorStore';
import type { MapTheme, ToolMode } from '@store/editorStore';

const themes: { value: MapTheme; label: string }[] = [
  { value: 'catacomb', label: '地下墓穴' },
  { value: 'ice_cave', label: '冰窟' },
  { value: 'lava_cave', label: '岩浆洞穴' },
];

const tools: { value: ToolMode; label: string; icon: string }[] = [
  { value: 'select', label: '选择', icon: '🖱️' },
  { value: 'wall', label: '墙壁', icon: '🧱' },
  { value: 'door', label: '空地', icon: '⬜' },
  { value: 'decoration', label: '装饰', icon: '✨' },
];

export const Toolbar: React.FC = () => {
  const theme = useEditorStore((s) => s.theme);
  const rows = useEditorStore((s) => s.rows);
  const cols = useEditorStore((s) => s.cols);
  const toolMode = useEditorStore((s) => s.toolMode);
  const showSuccessToast = useEditorStore((s) => s.showSuccessToast);
  const patrolPath = useEditorStore((s) => s.patrolPath);

  const setTheme = useEditorStore((s) => s.setTheme);
  const setRows = useEditorStore((s) => s.setRows);
  const setCols = useEditorStore((s) => s.setCols);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const generateNewMap = useEditorStore((s) => s.generateNewMap);
  const exportJSON = useEditorStore((s) => s.exportJSON);
  const cancelPatrolPath = useEditorStore((s) => s.cancelPatrolPath);
  const completePatrolPath = useEditorStore((s) => s.completePatrolPath);

  const handleExport = useCallback(() => {
    const json = exportJSON();
    try {
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roguelike-map-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }, [exportJSON]);

  const handleRowsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      if (!isNaN(v)) setRows(v);
    },
    [setRows]
  );

  const handleColsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      if (!isNaN(v)) setCols(v);
    },
    [setCols]
  );

  const isPatrolMode = toolMode === 'patrol';

  return (
    <>
      <div
        style={{
          height: 50,
          background: '#0a192f',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 10,
          borderBottom: '1px solid #1a2a4a',
          flexShrink: 0,
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingRight: 12,
            marginRight: 4,
            borderRight: '1px solid #1a2a4a',
          }}
        >
          <span style={{ fontSize: 18 }}>🏰</span>
          <span
            style={{
              color: '#e94560',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}
          >
            ROGUELIKE EDITOR
          </span>
        </div>

        {/* Map Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={labelStyle}>主题</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as MapTheme)} style={selectStyle}>
            {themes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Grid Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={labelStyle}>行</span>
          <input
            type="number"
            min={5}
            max={20}
            value={rows}
            onChange={handleRowsChange}
            onBlur={handleRowsChange}
            style={inputStyle}
          />
          <span style={{ color: '#6a7a8a', fontSize: 12 }}>×</span>
          <span style={labelStyle}>列</span>
          <input
            type="number"
            min={5}
            max={20}
            value={cols}
            onChange={handleColsChange}
            onBlur={handleColsChange}
            style={inputStyle}
          />
        </div>

        {/* Generate Button */}
        <button onClick={generateNewMap} style={primaryButtonStyle}>
          ⚡ 生成地图
        </button>

        {/* Separator */}
        <div style={separatorStyle} />

        {/* Tool Buttons */}
        {tools.map((t) => (
          <button
            key={t.value}
            onClick={() => (isPatrolMode ? cancelPatrolPath() : setToolMode(t.value))}
            style={{
              ...toolButtonStyle,
              background: !isPatrolMode && toolMode === t.value ? '#e94560' : 'transparent',
              color: !isPatrolMode && toolMode === t.value ? '#fff' : '#8899aa',
              border: !isPatrolMode && toolMode === t.value ? '1px solid #e94560' : '1px solid transparent',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}

        {/* Patrol Mode Indicator */}
        {isPatrolMode && (
          <>
            <div
              style={{
                padding: '4px 12px',
                background: 'rgba(83, 52, 131, 0.5)',
                border: '1px solid #533483',
                borderRadius: 4,
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              🎯 路径编辑中（{patrolPath.points.length} 点）
            </div>
            {patrolPath.points.length >= 2 && (
              <button onClick={completePatrolPath} style={successButtonStyle}>
                ✓ 完成
              </button>
            )}
            <button onClick={cancelPatrolPath} style={cancelButtonStyle}>
              ✕ 取消
            </button>
          </>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Export Button */}
        <button onClick={handleExport} style={primaryButtonStyle}>
          📤 导出 JSON
        </button>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 36,
            background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            zIndex: 99999,
            boxShadow: '0 4px 20px rgba(39, 174, 96, 0.4)',
            animation: 'slideDownToast 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          ✓ 导出成功！JSON 文件已下载
        </div>
      )}

      <style>{`
        @keyframes slideDownToast {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        select::-ms-expand { display: none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          opacity: 0.5;
        }
      `}</style>
    </>
  );
};

const labelStyle: React.CSSProperties = {
  color: '#6a7a8a',
  fontSize: 12,
  fontWeight: 600,
};

const selectStyle: React.CSSProperties = {
  background: '#16213e',
  color: '#e0e0e0',
  border: '1px solid #2a3a5a',
  borderRadius: 5,
  padding: '5px 10px',
  fontSize: 12,
  outline: 'none',
  cursor: 'pointer',
  fontWeight: 500,
  height: 28,
};

const inputStyle: React.CSSProperties = {
  width: 48,
  background: '#16213e',
  color: '#e0e0e0',
  border: '1px solid #2a3a5a',
  borderRadius: 5,
  padding: '4px 6px',
  fontSize: 12,
  textAlign: 'center',
  outline: 'none',
  fontWeight: 600,
  height: 28,
};

const separatorStyle: React.CSSProperties = {
  width: 1,
  height: 26,
  background: '#1a2a4a',
  margin: '0 2px',
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #e94560, #c73650)',
  color: '#fff',
  border: 'none',
  borderRadius: 5,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  height: 30,
  letterSpacing: 0.3,
  boxShadow: '0 2px 8px rgba(233, 69, 96, 0.25)',
};

const successButtonStyle: React.CSSProperties = {
  background: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: 5,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  height: 28,
};

const cancelButtonStyle: React.CSSProperties = {
  background: '#555',
  color: '#fff',
  border: 'none',
  borderRadius: 5,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  height: 28,
};

const toolButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#8899aa',
  border: '1px solid transparent',
  borderRadius: 5,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
  height: 28,
};
