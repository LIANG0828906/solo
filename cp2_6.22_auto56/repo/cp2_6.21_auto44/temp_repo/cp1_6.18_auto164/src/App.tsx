import React from 'react';
import ScentCardLibrary from './components/ScentCardLibrary';
import PerfumeMixingPanel from './components/PerfumeMixingPanel';
import BottlePreview from './components/BottlePreview';
import SavePerfumeForm from './components/SavePerfumeForm';
import PerfumeLibraryGrid from './components/PerfumeLibraryGrid';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">气味实验室</span>
          <span className="logo-sub">Scent Lab</span>
        </div>
        <div className="app-tagline">调配你的专属气味记忆</div>
      </header>

      <main className="app-main">
        <section className="app-top-row">
          <div className="left-mixing-area">
            <ScentCardLibrary />
            <PerfumeMixingPanel />
          </div>

          <div className="right-preview-area">
            <BottlePreview />
            <SavePerfumeForm />
          </div>
        </section>

        <section className="app-bottom-row">
          <PerfumeLibraryGrid />
        </section>
      </main>

      <footer className="app-footer">
        <span>© 气味实验室 · 每一种气味都有它的故事</span>
      </footer>
    </div>
  );
};

export default App;
