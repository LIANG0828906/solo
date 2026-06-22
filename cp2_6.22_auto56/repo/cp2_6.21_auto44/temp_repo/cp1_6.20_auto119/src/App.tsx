import { useState } from 'react';
import * as THREE from 'three';
import { TurbineScene } from './TurbineScene';
import { UIPanel } from './UIPanel';

function App() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState<THREE.Camera | null>(null);

  const handleCanvasReady = (canvasEl: HTMLCanvasElement, cam: THREE.Camera) => {
    setCanvas(canvasEl);
    setCamera(cam);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <TurbineScene onCanvasReady={handleCanvasReady} />
      <UIPanel />
    </div>
  );
}

export default App;
