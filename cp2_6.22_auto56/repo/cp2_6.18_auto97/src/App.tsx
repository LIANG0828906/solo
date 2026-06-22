import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from './store';
import ColorPicker from './components/ColorPicker';
import PaletteBar from './components/PaletteBar';
import PreviewPanel from './components/PreviewPanel';

const App: React.FC = () => {
  const { currentMode, schemes, exportPalette } = useStore();
  const [exported, setExported] = useState(false);
  const currentScheme = schemes[currentMode];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', currentScheme.background);
    root.style.setProperty('--text-color', currentScheme.text);
    root.style.setProperty('--primary-color', currentScheme.primary);
    root.style.setProperty('--secondary-color', currentScheme.secondary);
    root.style.setProperty('--border-color', currentScheme.border);
  }, [currentScheme]);

  const handleExport = useCallback(async () => {
    await exportPalette();
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }, [exportPalette]);

  return (
    <div className="app" style={{ backgroundColor: currentScheme.background }}>
      <header className="navbar">
        <div className="navbar-content">
          <h1 className="logo">🎨 ColorMaster</h1>
          <ColorPicker />
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <PaletteBar />
        </aside>

        <section className="content-area">
          <PreviewPanel />
        </section>
      </main>

      <button
        className="export-btn"
        onClick={handleExport}
        style={{
          backgroundColor: currentScheme.primary,
          color: '#FFFFFF',
          boxShadow: `inset 0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)`
        }}
      >
        {exported ? '已复制!' : '导出 JSON'}
      </button>
    </div>
  );
};

export default App;
