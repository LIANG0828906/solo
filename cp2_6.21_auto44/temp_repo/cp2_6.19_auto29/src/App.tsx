import React, { useState } from 'react';
import Editor from './pages/Editor';
import Community from './pages/Community';
import './App.css';

type PageType = 'editor' | 'community' | 'favorites';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('editor');

  const navItems: { key: PageType; label: string; icon: React.ReactNode }[] = [
    {
      key: 'editor',
      label: '创作',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
    {
      key: 'community',
      label: '社区',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: 'favorites',
      label: '收藏',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="app-container">
      <div className="app-bg">
        <div className="bg-gradient bg-gradient-1" />
        <div className="bg-gradient bg-gradient-2" />
        <div className="bg-noise" />
      </div>

      <nav className="app-nav">
        <div className="nav-brand">
          <span className="brand-icon">✨</span>
          <span className="brand-text">Meme Studio</span>
        </div>
        <div className="nav-items">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="app-content">
        {currentPage === 'editor' && <Editor />}
        {currentPage === 'community' && <Community />}
        {currentPage === 'favorites' && <Community showFavorites />}
      </main>
    </div>
  );
};

export default App;
