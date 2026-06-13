import { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StarScene } from './stars/starScene';
import { generateStars } from './stars/starGenerator';
import { StarData, SpectralType, SPECTRAL_TYPES } from './stars/types';
import './ui/styles.css';

function Main() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StarScene | null>(null);
  const starsRef = useRef<StarData[]>([]);

  const [selectedStar, setSelectedStar] = useState<StarData | null>(null);
  const [brightness, setBrightness] = useState(1.0);
  const [activeFilters, setActiveFilters] = useState<SpectralType[]>([...SPECTRAL_TYPES]);

  const handleStarClick = useCallback((star: StarData | null) => {
    setSelectedStar(star);
  }, []);

  const handleBrightnessChange = useCallback((value: number) => {
    setBrightness(value);
    if (sceneRef.current) {
      sceneRef.current.updateBrightness(value);
    }
  }, []);

  const handleFilterChange = useCallback((filters: SpectralType[]) => {
    setActiveFilters(filters);
    if (sceneRef.current) {
      sceneRef.current.updateFilter(filters);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const stars = generateStars(300);
    starsRef.current = stars;

    const scene = new StarScene(containerRef.current, {
      onStarClick: handleStarClick,
    });

    scene.setStars(stars);
    scene.start();
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [handleStarClick]);

  return (
    <>
      <div ref={containerRef} className="scene-container" />
      <App
        selectedStar={selectedStar}
        brightness={brightness}
        activeFilters={activeFilters}
        onBrightnessChange={handleBrightnessChange}
        onFilterChange={handleFilterChange}
      />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Main />);
