import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import ArtworkList from './artwork/ArtworkList';
import { useStore } from './store/useStore';
import './index.css';

const ArtworkDetail = lazy(() => import('./artwork/ArtworkDetail'));

const App = () => {
  const { selectedArtworkId, currentUser } = useStore();

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-inner">
          <div className="logo">手工艺市集</div>
          <div className="nav-right">
            <div className="user-info">
              <span className="user-avatar">{currentUser.nickname.charAt(0)}</span>
              <span className="user-name">{currentUser.nickname}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <ArtworkList />
      </main>

      {selectedArtworkId && (
        <Suspense fallback={<div className="detail-loading">加载中...</div>}>
          <ArtworkDetail />
        </Suspense>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
