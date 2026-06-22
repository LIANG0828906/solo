import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MoleculeEngine, EngineState } from './engine/main';
import { MoleculePanel } from './ui/MoleculePanel';
import { Toolbar } from './ui/Toolbar';
import { InfoBar } from './ui/InfoBar';
import { HoverLabel } from './ui/HoverLabel';
import { MOLECULES, ELEMENT_CONFIG } from './data/molecules';
import { Element } from './types';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MoleculeEngine | null>(null);
  
  const [currentMoleculeId, setCurrentMoleculeId] = useState('h2o');
  const [atomCount, setAtomCount] = useState(0);
  const [bondCount, setBondCount] = useState(0);
  const [fps, setFps] = useState(60);
  const [showLabels, setShowLabels] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{
    atomId: string | null;
    element: Element | null;
    screenX: number;
    screenY: number;
    visible: boolean;
  }>({
    atomId: null,
    element: null,
    screenX: 0,
    screenY: 0,
    visible: false,
  });

  const moleculeOptions = MOLECULES.map(m => ({
    id: m.id,
    name: m.name,
    formula: m.formula,
  }));

  const currentMoleculeName = MOLECULES.find(m => m.id === currentMoleculeId)?.name || '';

  const handleEngineState = useCallback((state: EngineState) => {
    setCurrentMoleculeId(state.currentMoleculeId);
    setAtomCount(state.atomCount);
    setBondCount(state.bondCount);
    setFps(state.fps);
    
    if (state.hoveredAtomId && state.hoveredElement) {
      setHoverInfo({
        atomId: state.hoveredAtomId,
        element: state.hoveredElement as Element,
        screenX: state.hoveredScreenX,
        screenY: state.hoveredScreenY,
        visible: true,
      });
    } else {
      setHoverInfo(prev => ({ ...prev, visible: false }));
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new MoleculeEngine(containerRef.current);
    engineRef.current = engine;
    engine.setStateCallback(handleEngineState);
    engine.start();

    return () => {
      engine.dispose();
    };
  }, [handleEngineState]);

  const handleMoleculeChange = useCallback((id: string) => {
    if (engineRef.current) {
      engineRef.current.loadMolecule(id);
    }
  }, []);

  const handleToggleLabels = useCallback((show: boolean) => {
    setShowLabels(show);
    if (engineRef.current) {
      engineRef.current.setShowLabels(show);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetView();
    }
  }, []);

  const handleCenter = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.centerView();
    }
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    const newState = !autoRotate;
    setAutoRotate(newState);
    if (engineRef.current) {
      engineRef.current.setAutoRotate(newState);
    }
  }, [autoRotate]);

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full" />
      
      <InfoBar
        moleculeName={currentMoleculeName}
        atomCount={atomCount}
        bondCount={bondCount}
        fps={fps}
      />
      
      <Toolbar
        autoRotate={autoRotate}
        onCenter={handleCenter}
        onToggleAutoRotate={handleToggleAutoRotate}
        onReset={handleResetView}
      />
      
      <MoleculePanel
        currentMolecule={currentMoleculeId}
        molecules={moleculeOptions}
        atomCount={atomCount}
        bondCount={bondCount}
        showLabels={showLabels}
        onMoleculeChange={handleMoleculeChange}
        onToggleLabels={handleToggleLabels}
        onResetView={handleResetView}
      />
      
      <HoverLabel
        atomId={hoverInfo.atomId}
        element={hoverInfo.element}
        screenX={hoverInfo.screenX}
        screenY={hoverInfo.screenY}
        visible={hoverInfo.visible}
      />
    </div>
  );
};

export default App;
