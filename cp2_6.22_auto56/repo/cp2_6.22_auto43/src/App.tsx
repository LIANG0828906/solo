import React, { useState, useCallback } from 'react';
import type { EmotionRecord } from './modules/shared/types';
import EmotionForm from './modules/tracker/EmotionForm';
import CalendarHeatmap from './modules/visualization/CalendarHeatmap';
import TrendChart from './modules/visualization/TrendChart';
import SuggestionCards from './modules/visualization/SuggestionCards';
import ExportButton from './components/ExportButton';
import './App.css';

const App: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSubmitSuccess = useCallback((_record: EmotionRecord) => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-emoji">🌈</span>
            情绪追踪仪表盘
          </h1>
          <p className="app-subtitle">记录心情，了解自己，拥抱更好的生活</p>
        </div>
        <ExportButton />
      </header>

      <main className="app-main">
        <section className="section-left">
          <EmotionForm onSubmitSuccess={handleSubmitSuccess} />
        </section>

        <section className="section-right">
          <CalendarHeatmap refreshTrigger={refreshTrigger} />
          <TrendChart refreshTrigger={refreshTrigger} />
        </section>

        <section className="section-full">
          <SuggestionCards refreshTrigger={refreshTrigger} />
        </section>
      </main>

      <footer className="app-footer">
        <p>💜 情绪没有好坏，每一种感受都值得被看见</p>
      </footer>
    </div>
  );
};

export default App;
