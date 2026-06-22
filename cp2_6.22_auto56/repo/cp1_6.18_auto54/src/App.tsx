import React, { useRef, useCallback } from 'react';
import SceneRenderer from '@/modules/SceneRenderer';
import { useStarStore, useConstellationStore } from '@/modules/DataManager';
import SceneCanvas from '@/components/SceneCanvas';
import StarLibrary from '@/components/StarLibrary';
import GalleryPanel from '@/components/GalleryPanel';
import Toolbar from '@/components/Toolbar';
import type { StarData } from '@/types';

const App: React.FC = () => {
  const rendererRef = useRef<SceneRenderer | null>(null);
  const { canvasStars, selectedStarIds, setCanvasStars, setSelectedStarIds, removeStarFromCanvas } = useStarStore();
  const { connections, addConnection, saveConstellation, loadConstellation, setConnections } = useConstellationStore();

  const handleDragStart = useCallback((e: React.DragEvent, star: StarData) => {
    e.dataTransfer.setData('application/star', JSON.stringify(star));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleConnect = useCallback(() => {
    if (selectedStarIds.length < 2) return;
    for (let i = 0; i < selectedStarIds.length - 1; i++) {
      const pair: [string, string] = [selectedStarIds[i], selectedStarIds[i + 1]];
      const exists = connections.some(
        (c) =>
          (c.starIds[0] === pair[0] && c.starIds[1] === pair[1]) ||
          (c.starIds[0] === pair[1] && c.starIds[1] === pair[0])
      );
      if (!exists) {
        addConnection(pair);
      }
    }
  }, [selectedStarIds, connections, addConnection]);

  const handleSave = useCallback((name: string) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const thumbnail = renderer.captureSnapshot();
    saveConstellation(name, thumbnail, canvasStars, connections);
  }, [canvasStars, connections, saveConstellation]);

  const handleClear = useCallback(() => {
    for (const star of canvasStars) {
      rendererRef.current?.removeStar(star.id);
    }
    for (const conn of connections) {
      rendererRef.current?.removeConnection(conn.id);
    }
    setCanvasStars([]);
    setConnections([]);
    setSelectedStarIds([]);
  }, [canvasStars, connections, setCanvasStars, setConnections, setSelectedStarIds]);

  const handleLoadConstellation = useCallback((id: string) => {
    const data = loadConstellation(id);
    if (!data) return;

    for (const star of canvasStars) {
      rendererRef.current?.removeStar(star.id);
    }
    for (const conn of connections) {
      rendererRef.current?.removeConnection(conn.id);
    }

    setCanvasStars(data.stars);
    setConnections(data.connections);
    setSelectedStarIds([]);
  }, [canvasStars, connections, loadConstellation, setCanvasStars, setConnections, setSelectedStarIds]);

  return (
    <div className="app">
      <SceneCanvas rendererRef={rendererRef} />
      <StarLibrary onDragStart={handleDragStart} />
      <GalleryPanel onLoadConstellation={handleLoadConstellation} />
      <Toolbar onConnect={handleConnect} onSave={handleSave} onClear={handleClear} />
    </div>
  );
};

export default App;
