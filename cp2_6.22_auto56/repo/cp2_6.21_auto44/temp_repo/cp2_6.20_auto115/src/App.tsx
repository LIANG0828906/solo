import React from 'react';
import { AudioEngineProvider } from './components/AudioEngine';
import SpectrumVisualizer from './components/SpectrumVisualizer';
import TrackPanel from './components/TrackPanel';
import MasterControls from './components/MasterControls';

const App: React.FC = () => {
  return (
    <AudioEngineProvider>
      <div className="app-container">
        <div className="control-bar">
          <h1>🎵 在线音乐混音与频谱可视化工具</h1>
        </div>
        <SpectrumVisualizer />
        <MasterControls />
        <TrackPanel />
      </div>
    </AudioEngineProvider>
  );
};

export default App;
