import { Canvas } from '@react-three/fiber';
import Scene3D from '@/interactive/Scene3D';
import FragmentSystem from '@/interactive/FragmentSystem';
import NarrativeUI from '@/interactive/NarrativeUI';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 100, position: [1, 1, 1] }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene3D />
        <FragmentSystem />
      </Canvas>
      <NarrativeUI />
    </div>
  );
}
