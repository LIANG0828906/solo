import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';

type Page = 'home' | 'map' | 'profile';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'map':
        return <MapPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <span>🌿</span>
          <span>绿植交换</span>
        </div>
        <div className="navbar-nav">
          <button
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            🏠 发现
          </button>
          <button
            className={`nav-btn ${currentPage === 'map' ? 'active' : ''}`}
            onClick={() => setCurrentPage('map')}
          >
            📍 领养地图
          </button>
          <button
            className={`nav-btn ${currentPage === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentPage('profile')}
          >
            👤 我的
          </button>
        </div>
      </nav>
      <div className="page-content">
        {renderPage()}
      </div>
    </div>
  );
};

export default App;
