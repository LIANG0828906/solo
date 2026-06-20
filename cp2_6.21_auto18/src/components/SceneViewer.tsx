import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { useSceneStore } from '../store/sceneStore';
import { ExhibitMesh } from './ExhibitMesh';
import { LightingSystem } from './LightingSystem';
import { CameraController } from './CameraController';

export function SceneViewer() {
  const exhibits = useSceneStore((state) => state.exhibits);
  const selectExhibit = useSceneStore((state) => state.selectExhibit);

  const handleCanvasClick = () => {
    selectExhibit(null);
  };

  return (
    <div className="scene-viewer" onClick={handleCanvasClick}>
      <Canvas
        camera={{ position: [0, 3, 10], fov: 60 }}
        shadows
        gl={{ antialias: true, toneMapping: 1 }}
      >
        <color attach="background" args={['#0a0a14']} />
        <fog attach="fog" args={['#0a0a14', 15, 30]} />

        <CameraController />
        <LightingSystem />

        <Grid
          position={[0, -0.01, 0]}
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1a1a2e"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#2a2a4e"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#0d0d18" />
        </mesh>

        {exhibits.map((exhibit) => (
          <ExhibitMesh key={exhibit.id} exhibit={exhibit} />
        ))}
      </Canvas>
    </div>
  );
}
