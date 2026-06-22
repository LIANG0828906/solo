import { useState, useEffect } from 'react';
import { CategoryTabs } from './components/CategoryTabs';
import { TokenTable } from './components/TokenTable';
import { ColorGrid } from './components/ColorGrid';
import { PreviewCard } from './components/PreviewCard';
import { ResetDialog } from './components/ResetDialog';
import { useTokenStore } from './store/tokenStore';
import './App.css';

function App() {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const activeCategory = useTokenStore((state) => state.activeCategory);
  const resetTokens = useTokenStore((state) => state.resetTokens);
  const exportTokens = useTokenStore((state) => state.exportTokens);

  useEffect(() => {
    setContentKey((prev) => prev + 1);
  }, [activeCategory]);

  const handleExport = () => {
    const jsonData = exportTokens();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-tokens.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetTokens();
    setContentKey((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="13.5" cy="6.5" r=".5" />
              <circle cx="17.5" cy="10.5" r=".5" />
              <circle cx="8.5" cy="7.5" r=".5" />
              <circle cx="6.5" cy="12.5" r=".5" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="app-title">设计令牌管理面板</h1>
            <p className="app-subtitle">Design Token Manager</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button className="btn btn-outline" onClick={() => setShowResetDialog(true)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Reset
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="main-content">
          <div className="content-fade" key={contentKey + '-' + activeCategory}>
            <CategoryTabs />
            <TokenTable />
            {activeCategory === 'all' || activeCategory === 'color' ? (
              <ColorGrid />
            ) : null}
          </div>
        </section>

        <aside className="preview-panel">
          <PreviewCard />
        </aside>
      </main>

      <ResetDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}

export default App;
