import { useState, useMemo } from 'react';
import ScenePanel from './components/ScenePanel';
import ControlPanel from './components/ControlPanel';
import InfoPanel from './components/InfoPanel';
import { GridPoint, TerrainData } from './utils/dataLoader';
import { generateTerrainData } from './utils/terrainGenerator';
import './App.css';

function App() {
  const [year, setYear] = useState<number>(2013);
  const [selectedPoint, setSelectedPoint] = useState<GridPoint | null>(null);
  const [viewPreset, setViewPreset] = useState<string>('default');

  const terrainData: TerrainData = useMemo(() => generateTerrainData(), []);

  const yearIndex = year - terrainData.yearRange[0];

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  const handlePointClick = (point: GridPoint | null) => {
    setSelectedPoint(point);
  };

  const handleViewChange = (view: string) => {
    setViewPreset(view);
  };

  return (
    <div className="app-container">
      <div className="scene-area">
        <ScenePanel
          terrainData={terrainData}
          year={year}
          yearIndex={yearIndex}
          viewPreset={viewPreset}
          onPointClick={handlePointClick}
        />
      </div>
      <div className="control-area">
        <ControlPanel
          year={year}
          minYear={terrainData.yearRange[0]}
          maxYear={terrainData.yearRange[1]}
          minDensity={terrainData.minDensity}
          maxDensity={terrainData.maxDensity}
          onYearChange={handleYearChange}
          onViewChange={handleViewChange}
        />
        <InfoPanel
          selectedPoint={selectedPoint}
          year={year}
          yearIndex={yearIndex}
        />
      </div>
    </div>
  );
}

export default App;
