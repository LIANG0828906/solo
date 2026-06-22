import React, { useState, useCallback, useMemo } from 'react';
import CardWall from './CardWall';
import PostcardEditor from './PostcardEditor';
import ControlPanel from './ControlPanel';
import { generateInitialPostcards } from './utils';
import type { Postcard, AppState } from './types';

const App: React.FC = function App() {
  const initialPostcards = useMemo(() => generateInitialPostcards(), []);

  const [state, setState] = useState<AppState>({
    postcards: initialPostcards,
    selectedId: null,
    isDragging: false,
    zoomLevel: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const handleCardClick = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      selectedId: prev.selectedId === id ? null : id,
    }));
  }, []);

  const handleViewChange = useCallback((offsetX: number, offsetY: number, zoomLevel: number) => {
    setState((prev) => ({
      ...prev,
      offsetX,
      offsetY,
      zoomLevel,
    }));
  }, []);

  const handleZoomChange = useCallback((zoomLevel: number) => {
    setState((prev) => ({
      ...prev,
      zoomLevel,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      offsetX: 0,
      offsetY: 0,
      zoomLevel: 1,
    }));
  }, []);

  const handleSave = useCallback((id: string, note: string) => {
    setState((prev) => ({
      ...prev,
      postcards: prev.postcards.map((card) =>
        card.id === id ? { ...card, note } : card,
      ),
      selectedId: null,
    }));
  }, []);

  const handleCloseEditor = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedId: null,
    }));
  }, []);

  const selectedPostcard = useMemo(
    () => state.postcards.find((p) => p.id === state.selectedId) || null,
    [state.postcards, state.selectedId],
  );

  const appStyle: React.CSSProperties = {
    width: '100%',
    height: '100vh',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    fontFamily: 'Georgia, serif',
    backgroundColor: '#F5F0EB',
  };

  const sliderStyleOverride = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #D2B48C;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      background: #E8D4B8;
    }
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #D2B48C;
      cursor: pointer;
      border: none;
    }
    input[type="range"]::-moz-range-track {
      background: #555;
      height: 6px;
      border-radius: 8px;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
    }
  `;

  return (
    <div style={appStyle}>
      <style>{sliderStyleOverride}</style>
      <ControlPanel
        zoomLevel={state.zoomLevel}
        onZoomChange={handleZoomChange}
        onReset={handleReset}
      />
      <CardWall
        postcards={state.postcards}
        selectedId={state.selectedId}
        zoomLevel={state.zoomLevel}
        offsetX={state.offsetX}
        offsetY={state.offsetY}
        onCardClick={handleCardClick}
        onViewChange={handleViewChange}
      />
      <PostcardEditor
        selectedPostcard={selectedPostcard}
        onSave={handleSave}
        onClose={handleCloseEditor}
      />
    </div>
  );
};

export default App;
