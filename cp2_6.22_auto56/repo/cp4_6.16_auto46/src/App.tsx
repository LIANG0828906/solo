import React, { useEffect, useState } from 'react';
import { Music, User, Calendar, Home } from 'lucide-react';
import { useStore } from '@/store';
import ProfileModule from '@/modules/profile';
import MusicModule from '@/modules/music';
import TourModule from '@/modules/tour';
import './App.css';

type ViewType = 'home' | 'profile' | 'music' | 'tour';

const App: React.FC = () => {
  const { loadFromDB, artist } = useStore();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadFromDB();
      setIsLoading(false);
    };
    init();
  }, [loadFromDB]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">加载中...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon">
              <Music size={24} />
            </div>
            <span className="logo-text gradient-text">Artist Card</span>
          </div>
          <div className="nav-links">
            <button
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentView('home')}
            >
              <Home size={18} />
              <span>主页</span>
            </button>
            <button
              className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentView('profile')}
            >
              <User size={18} />
              <span>档案</span>
            </button>
            <button
              className={`nav-link ${currentView === 'music' ? 'active' : ''}`}
              onClick={() => setCurrentView('music')}
            >
              <Music size={18} />
              <span>作品</span>
            </button>
            <button
              className={`nav-link ${currentView === 'tour' ? 'active' : ''}`}
              onClick={() => setCurrentView('tour')}
            >
              <Calendar size={18} />
              <span>演出</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'home' && (
          <div className="home-view main-layout">
            <div className="content-left">
              <MusicModule />
            </div>
            <div className="content-right">
              <ProfileModule />
              <TourModule />
            </div>
          </div>
        )}

        {currentView === 'profile' && (
          <div className="module-view">
            <div className="module-wrapper">
              <ProfileModule />
            </div>
          </div>
        )}

        {currentView === 'music' && (
          <div className="module-view">
            <div className="module-wrapper">
              <MusicModule />
            </div>
          </div>
        )}

        {currentView === 'tour' && (
          <div className="module-view">
            <div className="module-wrapper">
              <TourModule />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
