import { useState } from 'react';
import CanvasEditor from './components/CanvasEditor';
import Marketplace from './components/Marketplace';
import './App.css';

type View = 'editor' | 'marketplace';

export default function App() {
  const [view, setView] = useState<View>('editor');
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePublished = () => {
    setRefreshKey((k) => k + 1);
    setView('marketplace');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <i className="fas fa-palette" /> 表情工坊
        </h1>
        <nav className="app-nav">
          <button
            className={`nav-btn ${view === 'editor' ? 'active' : ''}`}
            onClick={() => setView('editor')}
          >
            <i className="fas fa-paintbrush" /> 创作工坊
          </button>
          <button
            className={`nav-btn ${view === 'marketplace' ? 'active' : ''}`}
            onClick={() => setView('marketplace')}
          >
            <i className="fas fa-store" /> 作品集市
          </button>
        </nav>
      </header>
      <main className="app-main">
        {view === 'editor' ? (
          <CanvasEditor onPublished={handlePublished} />
        ) : (
          <Marketplace key={refreshKey} />
        )}
      </main>
    </div>
  );
}
