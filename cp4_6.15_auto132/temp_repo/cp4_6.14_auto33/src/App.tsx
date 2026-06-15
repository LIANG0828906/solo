import { useState, useCallback } from 'react';
import SceneViewer from './components/SceneViewer';
import TimeLine from './components/TimeLine';
import InfoPanel from './components/InfoPanel';
import type { BuildingInfo, ModelData } from './types';
import './App.css';

export default function App() {
  const [currentYear, setCurrentYear] = useState<number>(2024);
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  const handleYearChange = useCallback((year: number) => {
    if (isTransitioning || year === currentYear) return;
    setIsTransitioning(true);
    setCurrentYear(year);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [isTransitioning, currentYear]);

  const handleToggleSplitMode = useCallback(() => {
    setIsSplitMode(prev => !prev);
    setSelectedBuilding(null);
  }, []);

  const handleBuildingClick = useCallback((building: BuildingInfo | null) => {
    setSelectedBuilding(building);
  }, []);

  const handleResetCamera = useCallback(() => {
    setResetTrigger(prev => prev + 1);
  }, []);

  const handleModelLoaded = useCallback((_year: number, _data: ModelData) => {
  }, []);

  return (
    <div className="app-container">
      <button className="reset-btn" onClick={handleResetCamera}>
        重置视角
      </button>

      <button className="split-toggle-btn" onClick={handleToggleSplitMode}>
        {isSplitMode ? '退出分屏' : '分屏对比'}
      </button>

      <SceneViewer
        currentYear={currentYear}
        isSplitMode={isSplitMode}
        isTransitioning={isTransitioning}
        onBuildingClick={handleBuildingClick}
        onModelLoaded={handleModelLoaded}
        resetTrigger={resetTrigger}
      />

      {isTransitioning && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      )}

      <InfoPanel
        building={selectedBuilding}
        onClose={() => handleBuildingClick(null)}
      />

      <TimeLine
        currentYear={currentYear}
        onYearChange={handleYearChange}
        isSplitMode={isSplitMode}
        disabled={isTransitioning}
      />
    </div>
  );
}
