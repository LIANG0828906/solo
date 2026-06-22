import { useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Float, Effects } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OceanSurface } from './OceanSurface';
import { Buoy } from './Buoy';
import { WaveLines } from './WaveLines';
import { useStore } from '@/store/useStore';

const CameraController = () => {
  const { camera } = useThree();
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const targetY = 3 + Math.sin(time * 0.1) * 0.3;
    camera.position.y += (targetY - camera.position.y) * 0.01;
  });
  
  return null;
};

const SceneContent = () => {
  const { buoys, addBuoy, setSelectedBuoy } = useStore();

  const handlePlaneClick = useCallback((event: any) => {
    event.stopPropagation();
    const point = event.point;
    addBuoy([point.x, 0, point.z]);
    setSelectedBuoy(null);
  }, [addBuoy, setSelectedBuoy]);

  return (
    <>
      <CameraController />
      
      <ambientLight intensity={0.3} color="#4a90d9" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        color="#e0f0ff"
        castShadow
      />
      <pointLight position={[-10, 10, -10]} intensity={0.4} color="#ff6b6b" />
      <pointLight position={[10, 5, -10]} intensity={0.3} color="#4ecdc4" />

      <fog attach="fog" args={['#0a1a3a', 15, 60]} />

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <circleGeometry args={[50, 64]} />
          <meshStandardMaterial
            color="#0a1a3a"
            transparent
            opacity={0.9}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      </Float>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onClick={handlePlaneClick}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial />
      </mesh>

      <OceanSurface />

      <WaveLines />

      {buoys.map((buoy) => (
        <Buoy key={buoy.id} buoy={buoy} />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={0.2}
        dampingFactor={0.05}
        enableDamping
      />

      <Effects>
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette offset={0.5} darkness={0.5} />
        </EffectComposer>
      </Effects>
    </>
  );
};

export const OceanScene = () => {
  return (
    <Canvas
      camera={{ position: [0, 8, 15], fov: 60 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: 'linear-gradient(to bottom, #0a1a3a, #051025)' }}
    >
      <SceneContent />
    </Canvas>
  );
};
