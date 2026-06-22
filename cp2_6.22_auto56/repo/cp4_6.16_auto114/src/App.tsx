import React, { useEffect, useRef, useState } from 'react';
import { initScene, SceneManager } from './modules/scene';
import { useStore } from './store';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import InfoPanel from './components/InfoPanel';
import ControlBar from './components/ControlBar';
import FileUploader from './components/FileUploader';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'info' | 'data'>('info');
  
  const {
    buildings,
    selectedBuildingId,
    selectBuilding,
    sunPosition
  } = useStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const sceneManager = initScene(canvasRef.current);
    sceneManagerRef.current = sceneManager;

    sceneManager.setBuildings(buildings);
    sceneManager.updateSunPosition(sunPosition);

    const controls = new OrbitControls(
      sceneManager.getCamera(),
      sceneManager.getRenderer().domElement
    );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 300;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 20, 0);
    controlsRef.current = controls;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
    };
    animate();

    sceneManager.setOnBuildingClick((buildingId) => {
      selectBuilding(buildingId);
      if (buildingId && window.innerWidth <= 1024) {
        setPanelOpen(true);
      }
    });

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.info-panel') || 
          target.closest('.control-bar') || 
          target.closest('.file-uploader') ||
          target.closest('.panel-toggle-btn') ||
          target.closest('.mobile-toolbar')) {
        return;
      }
      sceneManager.handleClick(e);
    };

    const handleResize = () => {
      sceneManager.handleResize();
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      sceneManager.dispose();
    };
  }, []);

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setBuildings(buildings);
    }
  }, [buildings]);

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.selectBuilding(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateSunPosition(sunPosition);
    }
  }, [sunPosition]);

  const togglePanel = () => {
    setPanelOpen(!panelOpen);
  };

  const handleMobileTabClick = (tab: 'info' | 'data') => {
    setActiveMobileTab(tab);
    if (tab === 'info') {
      setPanelOpen(true);
    } else {
      setPanelOpen(false);
    }
  };



  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="canvas-container" />
      
      <button
        className="panel-toggle-btn"
        onClick={togglePanel}
      >
        {panelOpen ? '✕' : '☰'}
      </button>

      <div className="mobile-toolbar">
        <button
          className={`mobile-toolbar-btn ${activeMobileTab === 'info' ? 'active' : ''}`}
          onClick={() => handleMobileTabClick('info')}
        >
          🏢 分析
        </button>
        <button
          className={`mobile-toolbar-btn ${activeMobileTab === 'data' ? 'active' : ''}`}
          onClick={() => handleMobileTabClick('data')}
        >
          📁 数据
        </button>
      </div>

      <InfoPanel isOpen={panelOpen} />
      
      <ControlBar />
      
      <FileUploader />
      
      <LoadingOverlay />
    </div>
  );
};

export default App;
