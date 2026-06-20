import React from 'react';
import ControlPanel from './components/ControlPanel';
import FlavorRadarChart from './components/FlavorRadarChart';
import TastingNotes from './components/TastingNotes';
import RecordList from './components/RecordList';
import { useTeaStore } from './store/teaStore';

const App: React.FC = () => {
  const varieties = useTeaStore(state => state.varieties);
  const records = useTeaStore(state => state.records);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🍵 茶叶冲泡风味设计器</h1>
        <p className="app-subtitle">探索每一杯茶的独特风味</p>
      </header>

      <div className="app-main">
        <aside className="sidebar">
          <ControlPanel />
        </aside>

        <main className="main-content">
          <div className="canvas-section">
            <FlavorRadarChart />
          </div>

          <div className="notes-section">
            <TastingNotes />
          </div>
        </main>

        <aside className="record-sidebar">
          <RecordList />
        </aside>
      </div>
    </div>
  );
};

export default App;
