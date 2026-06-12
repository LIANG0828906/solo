import { Canvas } from '@react-three/fiber';
import SceneManager, { FPSUpdater } from './sceneManager';
import UIPanel from './uiPanel';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 5, 20], fov: 60 }}
        style={{ background: '#0d0d2b' }}
        gl={{ antialias: true }}
      >
        <fog attach="fog" args={['#0d0d2b', 15, 40]} />
        <SceneManager />
        <FPSUpdater />
      </Canvas>
      <UIPanel />
    </div>
  );
}
