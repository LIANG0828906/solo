import React, { useRef } from 'react';
import { IdeaTreePanel } from './components/IdeaTreePanel';
import { GraphCanvas } from './components/GraphCanvas';
import { AddIdeaModal } from './components/AddIdeaModal';
import { Toolbar } from './components/Toolbar';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div
      className="w-screen h-screen flex gap-4 p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A3A 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <IdeaTreePanel />

      <div className="flex-1 relative h-full">
        <Toolbar canvasRef={canvasRef} />
        <GraphCanvas ref={canvasRef} />
      </div>

      <AddIdeaModal />
    </div>
  );
};

export default App;
