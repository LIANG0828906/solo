import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Terrain from './scene/components/Terrain';
import InsectSwarm from './scene/components/InsectSwarm';
import TargetPoint from './scene/components/TargetPoint';
import ClickHandler from './scene/components/ClickHandler';
import ControlPanel from './ui/ControlPanel';
import StatsPanel from './ui/StatsPanel';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="viewport-container">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          performance={{ min: 0.5 }}
        >
          <PerspectiveCamera makeDefault position={[12, 14, 12]} fov={50} near={0.1} far={200} />
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            minDistance={5}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
          />

          <ambientLight intensity={0.45} />
          <directionalLight
            position={[10, 15, 8]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
            shadow-bias={-0.0005}
          />
          <hemisphereLight intensity={0.3} args={['#87CEEB', '#4A7C59']} />
          <fog attach="fog" args={['#1A1C1D', 25, 50]} />

          <Terrain />
          <InsectSwarm />
          <TargetPoint />
          <ClickHandler />
        </Canvas>

        <StatsPanel />
      </div>

      <ControlPanel />
    </div>
  );
};

export default App;
