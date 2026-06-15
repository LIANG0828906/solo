import { useState, useCallback } from 'react';
import { ThumbnailGrid } from './ThumbnailGrid';
import { SceneViewer } from './SceneViewer';
import { scenes } from '../data';
import type { SceneData } from '../types';
import './App.css';

type ViewMode = 'grid' | 'scene';

function App() {
  const [currentScene, setCurrentScene] = useState<SceneData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');

  const handleSceneClick = useCallback((scene: SceneData) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setAnimationPhase('fade-out');

    setTimeout(() => {
      setCurrentScene(scene);
      setViewMode('scene');
      setAnimationPhase('fade-in');
      setTimeout(() => {
        setAnimationPhase('idle');
        setIsTransitioning(false);
      }, 600);
    }, 400);
  }, [isTransitioning]);

  const handleBack = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setAnimationPhase('fade-out');

    setTimeout(() => {
      setCurrentScene(null);
      setViewMode('grid');
      setAnimationPhase('fade-in');
      setTimeout(() => {
        setAnimationPhase('idle');
        setIsTransitioning(false);
      }, 600);
    }, 400);
  }, [isTransitioning]);

  const handleSceneChange = useCallback((scene: SceneData) => {
    setCurrentScene(scene);
  }, []);

  const getAnimationClass = () => {
    switch (animationPhase) {
      case 'fade-out':
        return 'fade-out';
      case 'fade-in':
        return 'fade-in';
      default:
        return '';
    }
  };

  return (
    <div className="app-container">
      <div className={`view-container ${getAnimationClass()}`}>
        {viewMode === 'grid' && (
          <div className="gallery-page">
            <header className="gallery-header">
              <h1 className="gallery-title">3D Portfolio Gallery</h1>
              <p className="gallery-subtitle">Explore interactive 3D data visualizations</p>
            </header>
            <ThumbnailGrid scenes={scenes} onSceneClick={handleSceneClick} />
          </div>
        )}
        {viewMode === 'scene' && currentScene && (
          <SceneViewer
            scene={currentScene}
            onBack={handleBack}
            onSceneChange={handleSceneChange}
          />
        )}
      </div>
    </div>
  );
}

export default App;
