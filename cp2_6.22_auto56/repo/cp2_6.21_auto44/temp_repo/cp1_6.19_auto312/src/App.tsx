import React from 'react';
import { useTerrainStore, DATA_SOURCES } from './store/useTerrainStore';
import TerrainScene from './terrain/TerrainScene';
import ControlPanel from './control/ControlPanel';

const App: React.FC = () => {
  const dataSourceIndex = useTerrainStore((s) => s.dataSourceIndex);
  const source = DATA_SOURCES[dataSourceIndex];

  return (
    <div className="app-container">
      <div className="viewport-container">
        <div className="data-info-overlay">
          <div className="data-info-title">{source.name}</div>
          <div className="data-info-range">
            范围: {source.min} - {source.max} {source.unit}
          </div>
        </div>
        <TerrainScene />
      </div>
      <ControlPanel />
    </div>
  );
};

export default App;
