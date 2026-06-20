import { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager, DisplayMode } from './modules/scene/SceneManager';
import { Star, SpectralType, generateStars } from './modules/scene/StarData';
import { ConstellationSystem, SavedConstellation, ConstellationLine } from './modules/scene/ConstellationSystem';
import ControlPanel from './modules/ui/ControlPanel';
import StarList from './modules/ui/StarList';

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const constellationSystemRef = useRef<ConstellationSystem>(new ConstellationSystem());
  const [stars] = useState<Star[]>(() => generateStars(200, 50));
  const [displayMode, setDisplayMode] = useState<DisplayMode>('full');
  const [magnitudeRange, setMagnitudeRange] = useState<[number, number]>([0, 10]);
  const [spectralFilters, setSpectralFilters] = useState<SpectralType[]>(['O', 'B', 'A', 'F', 'G', 'K', 'M']);
  const [highlightedStarId, setHighlightedStarId] = useState<string | null>(null);
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null);
  const [savedConstellations, setSavedConstellations] = useState<SavedConstellation[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new SceneManager(containerRef.current);
    sceneManagerRef.current = sceneManager;

    sceneManager.addStars(stars);

    sceneManager.setOnStarClick((starId) => {
      handleStarClick(starId);
    });

    sceneManager.setOnStarDoubleClick((starId) => {
      handleStarDoubleClick(starId);
    });

    fetchSavedConstellations();

    return () => {
      sceneManager.dispose();
    };
  }, [stars]);

  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setDisplayMode(displayMode);
  }, [displayMode]);

  useEffect(() => {
    if (!sceneManagerRef.current) return;

    const visibleStarIds = new Set(
      stars
        .filter(star => {
          const inMagnitudeRange = 
            star.magnitude >= magnitudeRange[0] && star.magnitude <= magnitudeRange[1];
          const inSpectralType = spectralFilters.includes(star.spectralType);
          return inMagnitudeRange && inSpectralType;
        })
        .map(star => star.id)
    );

    sceneManagerRef.current.filterStars(visibleStarIds);
  }, [magnitudeRange, spectralFilters, stars]);

  const handleStarClick = useCallback((starId: string) => {
    setHighlightedStarId(starId);
    sceneManagerRef.current?.highlightStar(starId);
  }, []);

  const handleStarDoubleClick = useCallback((starId: string) => {
    const system = constellationSystemRef.current;

    if (selectedStarId === null) {
      setSelectedStarId(starId);
    } else {
      const line = system.addLine(selectedStarId, starId);
      if (line) {
        const startStar = stars.find(s => s.id === selectedStarId);
        const endStar = stars.find(s => s.id === starId);
        if (startStar && endStar) {
          sceneManagerRef.current?.addConstellationLine(startStar, endStar);
        }
      }
      setSelectedStarId(null);
    }
  }, [selectedStarId, stars]);

  const handleStarListClick = useCallback((starId: string) => {
    setHighlightedStarId(starId);
    sceneManagerRef.current?.highlightStar(starId);
    sceneManagerRef.current?.flyToStar(starId, 1000);
  }, []);

  const fetchSavedConstellations = async () => {
    try {
      const response = await fetch('/api/constellations');
      if (response.ok) {
        const data = await response.json();
        setSavedConstellations(data);
      }
    } catch (error) {
      console.error('Failed to fetch constellations:', error);
    }
  };

  const handleSaveConstellation = useCallback(async () => {
    const lines = constellationSystemRef.current.getLines();
    if (lines.length === 0) {
      alert('请先添加至少一条星座连线');
      return;
    }

    try {
      const response = await fetch('/api/constellations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lines: lines,
          lineCount: lines.length,
          starData: stars.map(s => ({
            id: s.id,
            name: s.name,
            position: s.position,
          })),
        }),
      });

      if (response.ok) {
        fetchSavedConstellations();
        alert('星座保存成功！');
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('Failed to save constellation:', error);
      alert('保存失败，请重试');
    }
  }, [stars]);

  const handleLoadConstellation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/constellations/${id}`);
      if (response.ok) {
        const data = await response.json();
        const lines: ConstellationLine[] = data.lines || [];
        
        constellationSystemRef.current.loadLines(lines);
        sceneManagerRef.current?.loadConstellation(stars, lines);
      }
    } catch (error) {
      console.error('Failed to load constellation:', error);
      alert('加载失败，请重试');
    }
  }, [stars]);

  return (
    <div className="app-container">
      <div ref={containerRef} className="canvas-container" />
      
      <ControlPanel
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        magnitudeRange={magnitudeRange}
        onMagnitudeRangeChange={setMagnitudeRange}
        spectralFilters={spectralFilters}
        onSpectralFilterChange={setSpectralFilters}
      />

      <StarList
        stars={stars}
        highlightedStarId={highlightedStarId}
        onStarClick={handleStarListClick}
        magnitudeRange={magnitudeRange}
        spectralFilters={spectralFilters}
        savedConstellations={savedConstellations}
        onSaveConstellation={handleSaveConstellation}
        onLoadConstellation={handleLoadConstellation}
      />
    </div>
  );
};

export default App;
