import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import ModelViewer from '@/components/ModelViewer';
import ControlPanel from '@/components/ControlPanel';
import HintText from '@/components/HintText';
import FlashOverlay from '@/components/FlashOverlay';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const showFlash = useAppStore((s) => s.showFlash);

  return (
    <div className="app-root">
      <div className="viewer-container">
        <Canvas
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
          camera={{ fov: 50, position: [0, 0, 5], near: 0.1, far: 100 }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0a0a1a']} />
          <fog attach="fog" args={['#0a0a1a', 8, 25]} />
          <ModelViewer />
        </Canvas>

        <HintText />
        <FlashOverlay visible={showFlash} />
      </div>

      <ControlPanel />
    </div>
  );
}
