import { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import SceneSetup from './components/SceneSetup';
import PlantRendererContainer from './components/PlantRenderer';
import ParamPanel from './components/ParamPanel';
import { usePlantStore } from './stores/plantStore';

function App() {
  const { addPlant } = usePlantStore();

  const handleSceneClick = useCallback((point: THREE.Vector3) => {
    point.y = 0;
    addPlant(point);
  }, [addPlant]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [10, 8, 15], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <SceneSetup />
        <PlantRendererContainer onSceneClick={handleSceneClick} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
      <ParamPanel />
    </div>
  );
}

export default App;
