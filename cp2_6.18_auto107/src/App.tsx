import React from 'react';
import { AudioUploader } from './components/AudioUploader';
import { Visualizer } from './components/Visualizer';
import { Controls } from './components/Controls';

const App: React.FC = () => {
  return (
    <div className="app">
      <div className="canvas-area">
        <Visualizer />
        <div className="uploader-overlay">
          <AudioUploader />
        </div>
      </div>
      <Controls />
    </div>
  );
};

export default App;
