import React, { useEffect, useRef } from 'react';
import { SceneManager } from './scene/SceneManager';
import { ControlPanel } from './components/ControlPanel';
import { DataPanel } from './components/DataPanel';
import { BottomControls } from './components/BottomControls';
import { useRootStore } from './store/rootStore';
import './styles/global.css';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const { rootNodes, hasReachedBottom, updateGrowth } = useRootStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new SceneManager(containerRef.current);
    sceneRef.current = sceneManager;

    sceneManager.setOnUpdate((delta) => {
      updateGrowth(delta);
    });

    sceneManager.start();

    return () => {
      sceneManager.dispose();
      sceneRef.current = null;
    };
  }, [updateGrowth]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateNodes(rootNodes, hasReachedBottom);
    }
  }, [rootNodes, hasReachedBottom]);

  return (
    <div className="app-container">
      <div ref={containerRef} className="scene-canvas" />
      <ControlPanel />
      <DataPanel />
      <BottomControls />
    </div>
  );
};

export default App;
