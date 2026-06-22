import { Canvas } from '@react-three/fiber';
import CityScene from '@/components/CityScene';
import ControlPanel from '@/components/ControlPanel';
import HUD from '@/components/HUD';
import Tooltip from '@/components/Tooltip';
import { uiConfig } from '@/data/uiConfig';
import { Suspense } from 'react';

function App() {
  const { colorPalette, camera } = uiConfig;

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: colorPalette.background,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{
          position: camera.initialPosition,
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{
          position: 'absolute',
          inset: 0,
          background: colorPalette.background,
        }}
      >
        <color attach="background" args={[colorPalette.background]} />
        <fog attach="fog" args={[colorPalette.background, 60, 150]} />
        <Suspense fallback={null}>
          <CityScene />
        </Suspense>
      </Canvas>

      <ControlPanel />
      <HUD />
      <Tooltip />
    </div>
  );
}

export default App;
