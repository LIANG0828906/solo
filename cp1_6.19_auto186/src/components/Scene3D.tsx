import { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import GeometryObject from './GeometryObject';
import SoundSource from './SoundSource';
import Receiver from './Receiver';
import RayPath from './RayPath';
import Heatmap from './Heatmap';

const SceneContent = () => {
  const groupRef = useRef<THREE.Group>(null);
  const geometries = useSceneStore((state) => state.geometries);
  const rayPaths = useSceneStore((state) => state.rayPaths);
  const receiverPositions = useSceneStore((state) => state.receiverPositions);
  const simulateRays = useSceneStore((state) => state.simulateRays);

  useEffect(() => {
    const timer = setTimeout(() => {
      simulateRays();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCanvasClick = (e: any) => {
    if (e.target === e.currentTarget) {
      useSceneStore.getState().selectGeometry(null);
    }
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.3}
      />

      <group ref={groupRef}>
        {geometries.map((geo) => (
          <GeometryObject key={geo.id} geometry={geo} />
        ))}
      </group>

      <SoundSource />

      {receiverPositions.map((_, index) => (
        <Receiver key={`receiver-${index}`} index={index} />
      ))}

      <group>
        {rayPaths.map((path, index) => (
          <RayPath 
            key={path.id} 
            path={path} 
            index={index}
            totalCount={rayPaths.length}
          />
        ))}
      </group>

      <Heatmap />

      <Grid
        args={[12, 24]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#3a3a3a"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#555555"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        position={[0, 0, 0]}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};

const Scene3D = () => {
  return (
    <div className="w-full h-full" style={{ minWidth: '800px', minHeight: '600px' }}>
      <Canvas
        gl={{ antialias: true }}
        shadows
        dpr={[1, 2]}
        style={{ background: '#1C1C1C' }}
      >
        <OrthographicCamera
          makeDefault
          position={[10, 10, 10]}
          zoom={50}
          near={0.1}
          far={1000}
        />
        <SceneContent />
      </Canvas>
    </div>
  );
};

export default Scene3D;
