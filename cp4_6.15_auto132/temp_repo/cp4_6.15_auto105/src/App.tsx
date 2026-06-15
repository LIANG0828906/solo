import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AssetList from './modules/asset-list/AssetList';
import AssetDetail from './modules/asset-detail/AssetDetail';
import AssetUpload from './modules/asset-upload/AssetUpload';
import { useAssetStore } from './modules/asset-store/store';
import './App.css';

type PageType = 'home' | 'detail' | 'upload';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { initMockData, setCurrentAsset, currentAssetId } = useAssetStore();

  useEffect(() => {
    initMockData();
  }, [initMockData]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/asset/')) {
        const id = hash.replace('#/asset/', '');
        setCurrentAsset(id);
        setCurrentPage('detail');
      } else if (hash === '#/upload') {
        setCurrentPage('upload');
      } else {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setCurrentAsset]);

  const handleNavigate = (page: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (page === 'home') {
        window.location.hash = '#/';
      } else if (page === 'upload') {
        window.location.hash = '#/upload';
      }
      setIsTransitioning(false);
    }, 150);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'detail':
        return <AssetDetail />;
      case 'upload':
        return <AssetUpload />;
      case 'home':
      default:
        return <AssetList />;
    }
  };

  return (
    <div className="app">
      {currentPage !== 'detail' && (
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      )}
      <main className={`main-content ${currentPage !== 'detail' ? 'with-nav' : ''}`}>
        <div className={`page-wrapper ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
