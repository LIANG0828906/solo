import React from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import DetailPanel from './components/DetailPanel';
import FavoritesSidebar from './components/FavoritesSidebar';
import { useLandmarkStore } from './store/landmarkStore';

const App: React.FC = () => {
  const { selectedLandmark, showFavoritesSidebar } = useLandmarkStore();

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <div className="map-container">
          <SearchPanel />
          <MapView />
        </div>
        <DetailPanel landmark={selectedLandmark} />
        {showFavoritesSidebar && (
          <>
            <div
              className="overlay"
              onClick={() => useLandmarkStore.getState().setShowFavoritesSidebar(false)}
            />
            <FavoritesSidebar />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
