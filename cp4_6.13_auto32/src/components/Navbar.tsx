import React from 'react';
import { useStore } from '../store/useStore';

export const Navbar: React.FC = () => {
  const { 
    selectedFeedId, 
    feeds, 
    articles, 
    setShowAboutModal,
    isDarkMode 
  } = useStore();
  
  const selectedFeed = feeds.find(f => f.id === selectedFeedId);
  const feedArticlesCount = selectedFeedId 
    ? articles.filter(a => a.feedId === selectedFeedId).length 
    : 0;

  return (
    <nav className={`navbar ${isDarkMode ? 'dark' : ''}`}>
      <div className="navbar-content">
        <div className="navbar-left">
          <h1 className="app-title">纸读</h1>
        </div>
        
        <div className="navbar-center">
          {selectedFeed ? (
            <span className="current-feed">
              {selectedFeed.title}
              <span className="article-count">({feedArticlesCount}篇文章)</span>
            </span>
          ) : (
            <span className="current-feed placeholder">请选择订阅源</span>
          )}
        </div>
        
        <div className="navbar-right">
          <button 
            className="nav-btn"
            onClick={() => document.querySelector<HTMLElement>('.add-feed-input')?.focus()}
          >
            + 添加源
          </button>
          <button 
            className="nav-btn"
            onClick={() => setShowAboutModal(true)}
          >
            关于
          </button>
        </div>
      </div>
      <div className="navbar-divider"></div>
    </nav>
  );
};
