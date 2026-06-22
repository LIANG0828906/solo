import React from 'react';
import { Dashboard } from './Dashboard';
import { Editor } from './Editor';
import { Calendar } from './Calendar';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="app-background">
        <div className="grid-overlay"></div>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="app-content">
        <header className="app-header">
          <div className="flex items-center gap-3">
            <div className="app-logo">
              <span className="logo-text">CC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ContentCal</h1>
              <p className="text-xs text-gray-400">多平台内容日历管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot online"></span>
            <span className="text-xs text-gray-400">系统正常</span>
          </div>
        </header>

        <main className="app-main">
          <section className="section-dashboard">
            <Dashboard />
          </section>

          <div className="editor-calendar-wrapper">
            <section className="section-editor">
              <Editor />
            </section>

            <section className="section-calendar">
              <Calendar />
            </section>
          </div>
        </main>

        <footer className="app-footer">
          <p className="text-xs text-gray-500">
            © 2024 ContentCal · 让内容运营更高效
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
