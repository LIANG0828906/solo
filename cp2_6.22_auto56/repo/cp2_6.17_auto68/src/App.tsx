import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from './components/Editor';
import PoemList from './components/PoemList';
import PoemDetail from './components/PoemDetail';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">WindWhisper</span>
        </div>
        <nav className="nav-links">
          <a href="/" className="nav-link">诗集</a>
          <a href="/editor" className="nav-link nav-link-accent">创作</a>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<PoemList />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/poem/:id" element={<PoemDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
