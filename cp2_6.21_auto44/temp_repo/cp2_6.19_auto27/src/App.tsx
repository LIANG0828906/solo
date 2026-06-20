import React, { useState, useEffect } from 'react';
import { ArtworkPanel } from './modules/ui/ArtworkPanel';
import { CanvasArea } from './modules/ui/CanvasArea';
import { DetailModal } from './modules/ui/DetailModal';
import { useStore } from './store/useStore';
import { Artwork } from './modules/layout/types';

const App: React.FC = () => {
  const { loadFromStorage } = useStore();
  const [draggingArtwork, setDraggingArtwork] = useState<Artwork | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setIsInitialized(true);
  }, [loadFromStorage]);

  const handleDragStart = (artwork: Artwork, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingArtwork(artwork);
  };

  const handleDragEnd = (_didPlace: boolean) => {
    setDraggingArtwork(null);
  };

  if (!isInitialized) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          backgroundColor: '#2A2A2A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: 14,
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        overflow: 'hidden',
      }}
    >
      <ArtworkPanel onDragStart={handleDragStart} />
      <CanvasArea
        draggingArtwork={draggingArtwork}
        onDragEnd={handleDragEnd}
      />
      <DetailModal />
    </div>
  );
};

export default App;
