import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ControlPanel } from './ui/ControlPanel';
import { InfoPanel } from './ui/InfoPanel';
import { Scene3D } from './scene/Scene3D';
import { SelectedRayInfo } from './scene/SceneManager';
import { DEFAULT_CAMERA } from './utils/constants';

const App: React.FC = () => {
  const [selectedRay, setSelectedRay] = useState<SelectedRayInfo | null>(null);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 100%)',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{
          position: DEFAULT_CAMERA.position,
          fov: DEFAULT_CAMERA.fov,
          near: DEFAULT_CAMERA.near,
          far: DEFAULT_CAMERA.far,
        }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene3D onRaySelect={setSelectedRay} />
        <InfoPanel info={selectedRay} />
      </Canvas>

      <ControlPanel />

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 2,
          textShadow: '0 0 20px rgba(137, 207, 240, 0.6)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        3D 光线折射与色散模拟器
      </div>
    </div>
  );
};

export default App;
