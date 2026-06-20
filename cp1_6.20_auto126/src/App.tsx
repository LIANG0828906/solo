import React, { useRef, useMemo } from 'react';
import { KeyboardMap } from './components/KeyboardMap';
import { Keyboard3DPreview } from './components/Keyboard3DPreview';
import { useThemeColors, PRESET_THEMES } from './hooks/useThemeColors';
import { KeyMaterial } from './types';
import { KEYBOARD_LAYOUT } from './data/keyboardLayout';

const MATERIAL_OPTIONS: { id: KeyMaterial; label: string }[] = [
  { id: 'matte', label: '哑光' },
  { id: 'glossy', label: '亮光' },
  { id: 'satin', label: '磨砂' },
];

const App: React.FC = () => {
  const {
    colorScheme,
    activeThemeId,
    animationTrigger,
    toast,
    selectedKeyId,
    setSelectedKeyId,
    updateKeyColor,
    updateKeyMaterial,
    applyPresetTheme,
    exportScheme,
    importScheme,
  } = useThemeColors();

  const importInputRef = useRef<HTMLInputElement>(null);

  const selectedKey = useMemo(
    () => KEYBOARD_LAYOUT.find((k) => k.id === selectedKeyId) ?? null,
    [selectedKeyId]
  );

  const selectedColor = selectedKeyId ? colorScheme.keys[selectedKeyId]?.color ?? '#FFFFFF' : '#FFFFFF';
  const selectedMaterial = selectedKeyId ? colorScheme.keys[selectedKeyId]?.material ?? 'matte' : 'matte';

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedKeyId) return;
    updateKeyColor(selectedKeyId, e.target.value);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedKeyId) return;
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      updateKeyColor(selectedKeyId, val.toUpperCase());
    }
  };

  const handleImportClick = () => importInputRef.current?.click();

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? '';
      importScheme(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="left-panel">
          <div className="panel-title">键盘布局 · 点击选择按键</div>
          <KeyboardMap
            colorScheme={colorScheme.keys}
            selectedKeyId={selectedKeyId}
            onSelectKey={setSelectedKeyId}
          />
        </div>
        <div className="right-panel">
          <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 10, pointerEvents: 'none' }}>
            <div className="panel-title" style={{ marginBottom: 6 }}>3D 实时预览 · 拖拽旋转</div>
            {selectedKey && (
              <div className="selected-key-info">
                当前选中：
                <span className="selected-key-label">
                  {selectedKey.label || '空格 (Space)'}
                </span>
              </div>
            )}
          </div>
          <Keyboard3DPreview
            colorScheme={colorScheme}
            animationTrigger={animationTrigger}
            selectedKeyId={selectedKeyId}
          />
        </div>
      </div>

      <div className="control-bar">
        <div className="control-section">
          <span className="control-label">按键颜色</span>
          <div className="color-picker-wrapper">
            <input
              type="color"
              className="color-picker"
              value={selectedColor}
              onChange={handleColorChange}
              disabled={!selectedKeyId}
            />
            <input
              type="text"
              className="color-hex"
              value={selectedColor}
              onChange={handleHexInput}
              maxLength={7}
              disabled={!selectedKeyId}
            />
          </div>
        </div>

        <div className="control-section">
          <span className="control-label">键帽材质</span>
          <div className="material-group">
            {MATERIAL_OPTIONS.map((m) => (
              <button
                key={m.id}
                className={`btn ${selectedMaterial === m.id ? 'btn-active' : ''}`}
                onClick={() => selectedKeyId && updateKeyMaterial(selectedKeyId, m.id)}
                disabled={!selectedKeyId}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-section" style={{ flex: 1, minWidth: 280 }}>
          <span className="control-label">预设主题</span>
          <div className="theme-group">
            {PRESET_THEMES.map((t) => (
              <button
                key={t.id}
                className={`btn theme-btn ${activeThemeId === t.id ? 'btn-active' : ''}`}
                onClick={() => applyPresetTheme(t.id)}
              >
                <div className="theme-preview">
                  {t.colors.slice(0, 4).map((c, i) => (
                    <span key={i} className="theme-dot" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="theme-name">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-section">
          <span className="control-label">导入 / 导出</span>
          <div className="action-group">
            <button className="btn" onClick={exportScheme}>
              导出 JSON
            </button>
            <button className="btn" onClick={handleImportClick}>
              导入 JSON
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="import-input"
              onChange={handleFileImport}
            />
          </div>
        </div>
      </div>

      {toast.type && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;
