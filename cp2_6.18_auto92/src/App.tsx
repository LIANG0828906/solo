import React, { useEffect, useState } from 'react';
import { StarField } from './game/StarField';
import { InfoPanel } from './ui/InfoPanel';
import { CardModal } from './ui/CardModal';
import { useGameStore, CONSTELLATIONS } from './store/gameStore';

const App: React.FC = () => {
  const [dimensions, setDimensions] = useState({
    canvasWidth: window.innerWidth - 260,
    canvasHeight: window.innerHeight,
    isMobile: window.innerWidth < 768,
  });

  const { currentConstellation } = useGameStore();

  useEffect(() => {
    const firstConstellation = CONSTELLATIONS[0];
    useGameStore.getState().setCurrentConstellation(firstConstellation);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const canvasWidth = isMobile ? window.innerWidth : window.innerWidth - 260;
      const canvasHeight = isMobile ? window.innerHeight - 200 : window.innerHeight;
      setDimensions({ canvasWidth, canvasHeight, isMobile });

      if (currentConstellation) {
        const stars = useGameStore.getState().stars;
        if (stars.length > 0) {
          const scaleX = canvasWidth / (window.innerWidth - 260);
          const scaleY = canvasHeight / window.innerHeight;
          useGameStore.getState().setStars(
            stars.map((s) => ({
              ...s,
              x: Math.max(50, Math.min(canvasWidth - 50, s.x * scaleX)),
              y: Math.max(50, Math.min(canvasHeight - 50, s.y * scaleY)),
            }))
          );
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentConstellation]);

  const containerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexWrap: 'wrap',
    background: '#0B0E2A',
    overflow: 'hidden',
  };

  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    minWidth: dimensions.isMobile ? '100%' : 'auto',
    height: dimensions.isMobile ? 'calc(100% - 200px)' : '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  const titleOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle}>
      <div style={canvasContainerStyle}>
        <div style={titleOverlayStyle}>
          <h1
            style={{
              margin: 0,
              fontSize: dimensions.isMobile ? '20px' : '28px',
              fontWeight: 800,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: '2px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            ✦ ConstellationCross
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: dimensions.isMobile ? '11px' : '13px',
              color: 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '1px',
            }}
          >
            连接星星，解锁神话
          </p>
        </div>

        {dimensions.canvasWidth > 0 && dimensions.canvasHeight > 0 && (
          <StarField
            width={dimensions.canvasWidth}
            height={dimensions.canvasHeight}
          />
        )}
      </div>

      <div
        style={{
          order: dimensions.isMobile ? -1 : 1,
          width: dimensions.isMobile ? '100%' : 'auto',
          height: dimensions.isMobile ? '200px' : '100%',
        }}
      >
        <InfoPanel />
      </div>

      <CardModal />
    </div>
  );
};

export default App;
