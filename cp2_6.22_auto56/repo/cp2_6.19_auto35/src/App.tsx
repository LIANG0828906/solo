import React, { useEffect } from 'react';
import ArtworkPanel from './modules/ui/ArtworkPanel';
import CanvasArea from './modules/ui/CanvasArea';
import DetailModal from './modules/ui/DetailModal';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const { loadFromStorage } = useStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="app-container">
      <ArtworkPanel />
      <CanvasArea />
      <DetailModal />
    </div>
  );
};

export default App;
