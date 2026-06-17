import React, { useEffect, useRef, useState } from 'react';
import { StarScene } from '@/modules/StarScene';
import { useStarStore } from '@/store/starStore';
import AudioPlayer from '@/components/AudioPlayer';

const App: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const starSceneRef = useRef<StarScene | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    stars,
    selectedStarId,
    filterSpectralTypes,
    fetchStars,
    selectStar,
  } = useStarStore();

  useEffect(() => {
    fetchStars();
  }, [fetchStars]);

  useEffect(() => {
    if (!canvasContainerRef.current || starSceneRef.current) return;

    const container = canvasContainerRef.current;
    const scene = new StarScene(container, {
      onStarClick: (starId: string) => {
        selectStar(starId);
      },
      onBackgroundClick: () => {
        selectStar(null);
      },
    });

    starSceneRef.current = scene;
    setIsInitialized(true);

    return () => {
      scene.dispose();
      starSceneRef.current = null;
    };
  }, [selectStar]);

  useEffect(() => {
    if (!starSceneRef.current || stars.length === 0) return;
    starSceneRef.current.setStars(stars);
  }, [stars]);

  useEffect(() => {
    if (!starSceneRef.current) return;
    starSceneRef.current.selectStar(selectedStarId);
  }, [selectedStarId]);

  useEffect(() => {
    if (!starSceneRef.current) return;
    starSceneRef.current.setSpectralFilter(filterSpectralTypes);
  }, [filterSpectralTypes]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={canvasContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <AudioPlayer />
      {!isInitialized && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0B0E27',
            zIndex: 2000,
            transition: 'opacity 0.5s ease',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #9BB0FF, #FF4C4C)',
                boxShadow: '0 0 40px rgba(155, 176, 255, 0.5)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <p style={{ color: '#888899', fontSize: '14px', margin: 0 }}>
              正在加载光谱宇宙...
            </p>
          </div>
          <style>
            {`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
};

export default App;
