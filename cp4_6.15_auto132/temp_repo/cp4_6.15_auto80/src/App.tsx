import React, { useEffect } from 'react';
import { WindFarmScene } from '@/scene/WindFarmScene';
import { SidePanel } from '@/ui/SidePanel';
import { startWindDataSimulation, stopWindDataSimulation } from '@/utils/windDataSimulator';
import './index.css';

const App: React.FC = () => {
  useEffect(() => {
    startWindDataSimulation();
    return () => stopWindDataSimulation();
  }, []);

  return (
    <div className="app-container">
      <div className="scene-container">
        <WindFarmScene />
      </div>
      <SidePanel />
    </div>
  );
};

export default App;
