import React from 'react';
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
  { value: 'door', label: '门', icon: '🚪' },
  { value: 'decoration', label: '装饰', icon: '✨' },
  { value: 'patrol', label: '巡逻路径', icon: '↗️' },
];

export const Toolbar: React.FC = () => {
  const theme = useEditorStore((s) => s.theme);
  const rows = useEditorStore((s) => s.rows);
  const cols = useEditorStore((s) => s.cols);
  const toolMode = useEditorStore((s) => s.toolMode);
  const showSuccessToast = useEditorStore((s) => s.showSuccessToast);

  const setTheme = useEditorStore((s) => s.setTheme);
  const setRows = useEditorStore((s) => s.setRows);
  const setCols = useEditorStore((s) => s.setCols);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const generateNewMap = useEditorStore((s) => s.generateNewMap);
  const exportJSON = useEditorStore((s) => s.exportJSON);

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roguelike-map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        style={{
          height: 50,
          background: '#0a192f',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          borderBottom: '1px solid #1a2a4a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#8899aa', fontSize: 13 }}>主题</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as MapTheme)}
            style={selectStyle}
          >
            {themes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#8899aa', fontSize: 13 }}>行</span>
          <input
            type="number"
            min={5}
            max={20}
            value={rows}
            onChange={(e) => setRows(parseInt(e.target.value) || 5)}
            style={inputStyle}
          />
          <span style={{ color: '#8899aa', fontSize: 13 }}>列</span>
          <input
            type="number"
            min={5}
            max={20}
            value={cols}
            onChange={(e) => setCols(parseInt(e.target.value) || 5)}
            style={inputStyle}
          />
        </div>

        <button onClick={generateNewMap} style={buttonStyle}>
          生成地图
        </button>

        <div
          style={{
            width: 1,
            height: 28,
            background: '#1a2a4a',
            margin: '0 4px',
          }}
        />

        {tools.map((t) => (
          <button
            key={t.value}
            onClick={() => setToolMode(t.value)}
            style={{
              ...toolButtonStyle,
              background: toolMode === t.value ? '#e94560' : 'transparent',
              color: toolMode === t.value ? '#fff' : '#8899aa',
              border: toolMode === t.value ? '1px solid #e94560' : '1px solid transparent',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button onClick={handleExport} style={buttonStyle}>
          导出 JSON
        </button>
      </div>

      {showSuccessToast && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 36,
            background: '#27ae60',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 600,
            zIndex: 9999,
            animation: 'slideDown 0.3s ease',
          }}
        >
          导出成功！
        </div>
      )}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

const selectStyle: React.CSSProperties = {
  background: '#16213e',
  color: '#e0e0e0',
  border: '1px solid #2a3a5a',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: 48,
  background: '#16213e',
  color: '#e0e0e0',
  border: '1px solid #2a3a5a',
  borderRadius: 4,
  padding: '4px 6px',
  fontSize: 13,
  textAlign: 'center',
  outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  background: '#e94560',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const toolButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#8899aa',
  border: '1px solid transparent',
  borderRadius: 4,
  padding: '4px 10px',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
};
